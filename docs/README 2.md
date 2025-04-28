# Web3 Crypto Streaming Service - .NET Client

This folder contains a .NET client library for interacting with the Web3 Crypto Streaming Service platform. This library enables .NET developers to:

- Authenticate with the platform using Ethereum wallets
- Upload content to IPFS
- Register as creators
- Interact with platform smart contracts
- Manage stream tokens

## Requirements

- .NET 6.0 or later
- Nethereum library
- Newtonsoft.Json library

## Getting Started

### Installation

1. Add the project as a reference:
   ```bash
   dotnet add reference /path/to/WebStreamClient.csproj
   ```

2. Add required NuGet packages:
   ```bash
   dotnet add package Nethereum.Web3 --version 4.14.0
   dotnet add package Newtonsoft.Json --version 13.0.3
   ```

### Basic Usage

```csharp
// Initialize the client with API URL and Ethereum RPC URL
var client = new StreamClient("https://api.yourwebstreamservice.com", "https://mainnet.infura.io/v3/YOUR_INFURA_KEY");

// Authenticate with a private key (NEVER hardcode this in production)
string privateKey = "0x..."; // Your private key
bool authenticated = await client.AuthenticateAsync(privateKey);

if (authenticated)
{
    Console.WriteLine("Authentication successful!");
    
    // Get current user's profile
    var address = new Nethereum.Web3.Accounts.Account(privateKey).Address;
    var profile = await client.GetProfileAsync(address);
    
    if (profile != null)
    {
        Console.WriteLine($"Welcome back, {profile.Name}!");
    }
    else
    {
        // Register as a creator
        var registration = new CreatorRegistrationRequest
        {
            Name = "Creator Name",
            Email = "creator@example.com",
            Bio = "I create awesome content",
            Category = "education"
        };
        
        // Upload profile image first
        byte[] imageData = File.ReadAllBytes("profile.jpg");
        var imageCid = await client.UploadToIPFSAsync(imageData, "profile.jpg");
        
        if (imageCid != null)
        {
            registration.ProfileImageCid = imageCid;
            bool registered = await client.RegisterCreatorAsync(registration);
            
            if (registered)
            {
                Console.WriteLine("Creator registration successful!");
            }
        }
    }
    
    // Check token balance
    decimal balance = await client.GetTokenBalanceAsync();
    Console.WriteLine($"Your STREAM token balance: {balance}");
}
```

## Docker Support

You can run the .NET client in a Docker container using the official Microsoft .NET images.

### Build the Docker Image

```bash
docker build -t web3-streaming-dotnet-client ./dotnet
```

### Run with Docker Compose

We've provided a `docker-compose.yml` file in the root directory that sets up both the web frontend and the .NET client:

```bash
docker-compose up
```

### Using a Custom Image

You can also use one of Microsoft's official .NET images directly:

```bash
# Pull the official .NET SDK image
docker pull mcr.microsoft.com/dotnet/sdk:6.0

# Run a development container
docker run -it --rm -v ${PWD}:/app -w /app mcr.microsoft.com/dotnet/sdk:6.0 dotnet run
```

Available .NET images from Microsoft Container Registry:
- `mcr.microsoft.com/dotnet/sdk`: For development and building
- `mcr.microsoft.com/dotnet/aspnet`: Optimized for running ASP.NET Core applications
- `mcr.microsoft.com/dotnet/runtime`: For running .NET applications

## Security Notes

- NEVER hardcode private keys in your application code
- Use secure storage for sensitive information
- Consider using environment variables or secure configuration management
- Implement proper error handling in production applications

## Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
