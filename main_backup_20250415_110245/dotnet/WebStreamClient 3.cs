using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Threading.Tasks;
using Nethereum.Web3;
using Nethereum.Contracts;
using Nethereum.Hex.HexTypes;
using Nethereum.RPC.Eth.DTOs;
using Nethereum.Util;
using Newtonsoft.Json;

namespace WebStreamClient
{
    /// <summary>
    /// .NET client for interacting with the Web3 Crypto Streaming Service
    /// 
    /// INTERNAL DOCUMENTATION:
    /// This client provides the core integration layer between .NET applications
    /// and the Web3 Streaming platform. It handles authentication, IPFS uploads,
    /// creator registration, and blockchain interactions.
    /// 
    /// SECURITY CONSIDERATIONS:
    /// - Private keys should be handled securely and never stored in plain text
    /// - All HTTP requests are authenticated when required
    /// - Blockchain interactions are abstracted for safety
    /// 
    /// INTEGRATION NOTES:
    /// - Designed for both desktop and server applications
    /// - Maintains compatibility with .NET Standard 2.0+ platforms
    /// - Thread-safe operations for concurrent use
    /// </summary>
    public class StreamClient
    {
        // Core service dependencies
        private readonly HttpClient _httpClient;
        private readonly Web3 _web3;
        private readonly string _apiUrl;
        private string? _accessToken;

        /// <summary>
        /// Creates a new instance of the StreamClient
        /// 
        /// INTERNAL: Primary constructor that configures HTTP and Web3 connections
        /// USAGE: Should be instantiated once and reused
        /// </summary>
        public StreamClient(string apiUrl, string ethereumRpcUrl)
        {
            _httpClient = new HttpClient();
            _web3 = new Web3(ethereumRpcUrl);
            _apiUrl = apiUrl.TrimEnd('/');
        }

        /// <summary>
        /// Authenticates with the streaming service using a wallet
        /// 
        /// INTERNAL: Implements challenge-response authentication pattern
        /// SECURITY: Signs a nonce using the private key without exposing it
        /// ERROR HANDLING: Returns false rather than throwing on auth failure
        /// </summary>
        public async Task<bool> AuthenticateAsync(string privateKey)
        {
            try
            {
                var account = new Nethereum.Web3.Accounts.Account(privateKey);
                _web3.TransactionManager.Account = account;
                
                // Get nonce for signing
                var nonce = await GetNonceAsync(account.Address);
                
                // Sign message with nonce
                var signature = account.SignMessage(nonce);
                
                // Send authentication request
                var authResponse = await _httpClient.PostAsJsonAsync($"{_apiUrl}/auth", new
                {
                    Address = account.Address,
                    Nonce = nonce,
                    Signature = signature
                });
                
                if (authResponse.IsSuccessStatusCode)
                {
                    var content = await authResponse.Content.ReadAsStringAsync();
                    var response = JsonConvert.DeserializeObject<AuthResponse>(content);
                    
                    if (response?.Token != null)
                    {
                        _accessToken = response.Token;
                        _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _accessToken);
                        return true;
                    }
                }
                
                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Authentication error: {ex.Message}");
                return false;
            }
        }
        
        /// <summary>
        /// Gets user profile data
        /// </summary>
        public async Task<CreatorProfile?> GetProfileAsync(string walletAddress)
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_apiUrl}/creators/{walletAddress}");
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    return JsonConvert.DeserializeObject<CreatorProfile>(content);
                }
                
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching profile: {ex.Message}");
                return null;
            }
        }
        
        /// <summary>
        /// Uploads content to IPFS
        /// 
        /// INTERNAL: Handles multipart form posting of binary content
        /// SECURITY: Requires authentication token
        /// PERFORMANCE: Uses byte arrays for efficient memory management
        /// </summary>
        public async Task<string?> UploadToIPFSAsync(byte[] fileData, string fileName)
        {
            try
            {
                if (_accessToken == null)
                {
                    throw new InvalidOperationException("Not authenticated. Call AuthenticateAsync first.");
                }
                
                var content = new MultipartFormDataContent();
                content.Add(new ByteArrayContent(fileData), "file", fileName);
                
                var response = await _httpClient.PostAsync($"{_apiUrl}/ipfs/upload", content);
                
                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadAsStringAsync();
                    var ipfsResponse = JsonConvert.DeserializeObject<IPFSResponse>(result);
                    return ipfsResponse?.Cid;
                }
                
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"IPFS upload error: {ex.Message}");
                return null;
            }
        }
        
        /// <summary>
        /// Registers a creator on the platform with metadata
        /// </summary>
        public async Task<bool> RegisterCreatorAsync(CreatorRegistrationRequest request)
        {
            try
            {
                if (_accessToken == null)
                {
                    throw new InvalidOperationException("Not authenticated. Call AuthenticateAsync first.");
                }
                
                var response = await _httpClient.PostAsJsonAsync($"{_apiUrl}/creators/register", request);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Creator registration error: {ex.Message}");
                return false;
            }
        }
        
        /// <summary>
        /// Gets stream token balance for connected wallet
        /// 
        /// INTERNAL: Direct blockchain query for ERC-20 token balance
        /// INTEGRATION: Returns decimal for easier consumption by .NET apps
        /// CONTRACT INTERACTION: Uses the balanceOf standard ERC-20 function
        /// </summary>
        public async Task<decimal> GetTokenBalanceAsync()
        {
            try
            {
                if (_web3.TransactionManager.Account == null)
                {
                    throw new InvalidOperationException("Wallet not connected");
                }
                
                string contractAddress = "0x123..."; // Replace with actual token contract address
                string abi = "[ ... ]"; // Token ABI would go here
                
                var contract = _web3.Eth.GetContract(abi, contractAddress);
                var balanceFunction = contract.GetFunction("balanceOf");
                
                var balance = await balanceFunction.CallAsync<BigInteger>(_web3.TransactionManager.Account.Address);
                return Web3.Convert.FromWei(balance, 18); // Assuming 18 decimals for the token
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting token balance: {ex.Message}");
                return 0;
            }
        }
        
        /// <summary>
        /// Gets nonce for authentication from the API
        /// 
        /// INTERNAL: Helper method for the authentication flow
        /// SECURITY: Uses HTTPS for nonce transmission
        /// ERROR HANDLING: Throws exception to prevent auth with invalid nonce
        /// </summary>
        private async Task<string> GetNonceAsync(string address)
        {
            var response = await _httpClient.GetAsync($"{_apiUrl}/auth/nonce?address={address}");
            response.EnsureSuccessStatusCode();
            
            var content = await response.Content.ReadAsStringAsync();
            var nonceResponse = JsonConvert.DeserializeObject<NonceResponse>(content);
            return nonceResponse?.Nonce ?? throw new Exception("Failed to get nonce");
        }
    }
    
    // Data models
    public class NonceResponse
    {
        public string? Nonce { get; set; }
    }
    
    public class AuthResponse
    {
        public string? Token { get; set; }
        public string? UserId { get; set; }
    }
    
    public class IPFSResponse
    {
        public string? Cid { get; set; }
        public string? Url { get; set; }
    }
    
    public class CreatorProfile
    {
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Bio { get; set; }
        public string? Category { get; set; }
        public string? WalletAddress { get; set; }
        public string? RegistrationDate { get; set; }
        public string? ProfileImageCid { get; set; }
        public string? ProfileImageUrl { get; set; }
    }
    
    public class CreatorRegistrationRequest
    {
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Bio { get; set; }
        public string? Category { get; set; }
        public string? ProfileImageCid { get; set; }
    }
}
