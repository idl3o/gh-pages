using System;
using System.IO;
using System.Threading.Tasks;
using WebStreamClient;

namespace WebStreamExample
{
    class Program
    {
        static async Task Main(string[] args)
        {
            // Configuration 
            string apiUrl = "https://api.yourwebstreamservice.com";
            string ethereumRpc = "https://mainnet.infura.io/v3/YOUR_INFURA_KEY";
            
            // Initialize client
            var client = new StreamClient(apiUrl, ethereumRpc);
            
            // For testing only - in production, use secure storage
            Console.Write("Enter your private key (or leave empty to skip authentication): ");
            string privateKey = Console.ReadLine() ?? "";
            
            if (!string.IsNullOrEmpty(privateKey))
            {
                try
                {
                    bool authenticated = await client.AuthenticateAsync(privateKey);
                    if (authenticated)
                    {
                        Console.WriteLine("Authentication successful!");
                        
                        // Get account address from private key
                        var account = new Nethereum.Web3.Accounts.Account(privateKey);
                        var address = account.Address;
                        
                        // Get profile if exists
                        var profile = await client.GetProfileAsync(address);
                        
                        if (profile != null)
                        {
                            Console.WriteLine($"Profile found: {profile.Name}");
                            Console.WriteLine($"Bio: {profile.Bio}");
                            Console.WriteLine($"Category: {profile.Category}");
                            
                            // Display token balance
                            decimal balance = await client.GetTokenBalanceAsync();
                            Console.WriteLine($"STREAM token balance: {balance}");
                        }
                        else
                        {
                            Console.WriteLine("No profile found. Would you like to register? (y/n)");
                            if (Console.ReadLine()?.ToLower() == "y")
                            {
                                await RegisterCreator(client);
                            }
                        }
                    }
                    else
                    {
                        Console.WriteLine("Authentication failed.");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error: {ex.Message}");
                }
            }
            else
            {
                Console.WriteLine("Authentication skipped.");
            }
            
            Console.WriteLine("Press any key to exit...");
            Console.ReadKey();
        }
        
        static async Task RegisterCreator(StreamClient client)
        {
            Console.WriteLine("===== Creator Registration =====");
            
            Console.Write("Name: ");
            string name = Console.ReadLine() ?? "";
            
            Console.Write("Email: ");
            string email = Console.ReadLine() ?? "";
            
            Console.Write("Bio: ");
            string bio = Console.ReadLine() ?? "";
            
            Console.Write("Category (education, entertainment, gaming, music, tech, lifestyle, crypto, other): ");
            string category = Console.ReadLine() ?? "other";
            
            Console.Write("Path to profile image: ");
            string imagePath = Console.ReadLine() ?? "";
            
            string? profileImageCid = null;
            
            if (!string.IsNullOrEmpty(imagePath) && File.Exists(imagePath))
            {
                try
                {
                    byte[] imageData = File.ReadAllBytes(imagePath);
                    Console.WriteLine("Uploading image to IPFS...");
                    profileImageCid = await client.UploadToIPFSAsync(imageData, Path.GetFileName(imagePath));
                    
                    if (profileImageCid != null)
                    {
                        Console.WriteLine($"Image uploaded successfully! CID: {profileImageCid}");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error uploading image: {ex.Message}");
                }
            }
            
            var request = new CreatorRegistrationRequest
            {
                Name = name,
                Email = email,
                Bio = bio,
                Category = category,
                ProfileImageCid = profileImageCid
            };
            
            Console.WriteLine("Registering creator profile...");
            bool success = await client.RegisterCreatorAsync(request);
            
            if (success)
            {
                Console.WriteLine("Creator registration successful!");
            }
            else
            {
                Console.WriteLine("Creator registration failed.");
            }
        }
    }
}
