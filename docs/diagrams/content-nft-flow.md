# Content Creation and NFT Minting Flow

This document provides a sequence diagram illustrating the process of content creation and NFT minting in our Web3 Streaming Platform.

## Content Creation Sequence

```mermaid
sequenceDiagram
    actor Creator
    participant UI as Frontend UI
    participant Auth as Auth Controller
    participant Content as Content Controller
    participant ContentModel as Content Model
    participant IPFS as IPFS Storage
    
    Creator->>UI: Upload content
    UI->>Auth: Validate session
    Auth->>UI: Session valid
    UI->>IPFS: Upload content file
    IPFS->>UI: Return IPFS hash
    
    UI->>Content: publishContent(data, authToken)
    Content->>Auth: validateSession(authToken)
    Auth->>Content: Return user data
    
    Content->>ContentModel: createContent(data)
    ContentModel->>Content: Return content object
    Content->>UI: Return success response
    UI->>Creator: Display success message
```

## NFT Minting Sequence

```mermaid
sequenceDiagram
    actor Creator
    participant UI as Frontend UI
    participant Auth as Auth Controller
    participant NFT as NFT Controller
    participant Content as Content Controller
    participant Wallet as Web3 Wallet
    participant Blockchain as Blockchain
    
    Creator->>UI: Select content to mint as NFT
    UI->>Auth: Validate session
    Auth->>UI: Session valid
    
    UI->>Content: getContent(contentId)
    Content->>UI: Return content data
    
    UI->>NFT: mintContentNFT(mintData, authToken)
    NFT->>Auth: validateSession(authToken)
    Auth->>NFT: Return user data
    
    NFT->>Content: getContent(contentId)
    Content->>NFT: Return content data
    
    NFT->>Wallet: Request minting transaction
    
    Wallet->>Creator: Request approval
    Creator->>Wallet: Approve transaction
    
    Wallet->>Blockchain: Send mint transaction
    Blockchain->>Wallet: Return transaction receipt
    
    Wallet->>NFT: Return transaction data
    
    NFT->>Content: updateContent(contentId, nftData)
    Content->>NFT: Confirm update
    
    NFT->>UI: Return success with NFT details
    UI->>Creator: Display NFT minting confirmation
```

## Token Gated Access Sequence

```mermaid
sequenceDiagram
    actor Viewer
    participant UI as Frontend UI
    participant Auth as Auth Controller
    participant Content as Content Controller
    participant NFT as NFT Controller
    participant Wallet as Web3 Wallet
    participant Blockchain as Blockchain
    
    Viewer->>UI: Attempt to access content
    UI->>Content: getContent(contentId)
    Content->>UI: Return content with tokenGating info
    
    alt Content is token-gated
        UI->>Viewer: Request wallet connection
        Viewer->>Wallet: Connect wallet
        Wallet->>UI: Return wallet address
        
        UI->>NFT: checkTokenGatedAccess(contentId, walletAddress)
        NFT->>Content: getContent(contentId)
        Content->>NFT: Return content with gating config
        
        NFT->>Blockchain: Check token ownership
        Blockchain->>NFT: Return ownership status
        
        alt Has access
            NFT->>UI: Return { hasAccess: true }
            UI->>Viewer: Display content
        else No access
            NFT->>UI: Return { hasAccess: false, reason }
            UI->>Viewer: Display access denied with reason
        end
    else Content is not token-gated
        UI->>Viewer: Display content
    end
```

## Payment and Content Access Sequence

```mermaid
sequenceDiagram
    actor Viewer
    participant UI as Frontend UI
    participant Auth as Auth Controller
    participant Content as Content Controller
    participant Payment as Payment Controller
    participant Wallet as Web3 Wallet
    participant Blockchain as Blockchain
    
    Viewer->>UI: Attempt to access paid content
    UI->>Content: getContent(contentId)
    Content->>UI: Return content with payment info
    
    UI->>Payment: checkAccess(contentId, authToken)
    Payment->>UI: Return { hasAccess: false }
    
    UI->>Viewer: Display payment required
    Viewer->>UI: Click purchase button
    
    UI->>Viewer: Request wallet connection
    Viewer->>Wallet: Connect wallet
    Wallet->>UI: Return wallet address
    
    UI->>Payment: processPayment(contentId, amount, authToken)
    Payment->>Content: getContent(contentId)
    Content->>Payment: Return content data
    
    Payment->>Wallet: Request payment transaction
    
    Wallet->>Viewer: Request approval
    Viewer->>Wallet: Approve transaction
    
    Wallet->>Blockchain: Send payment transaction
    Blockchain->>Wallet: Return transaction receipt
    
    Wallet->>Payment: Return transaction data
    Payment->>UI: Return { success: true, paymentId }
    
    UI->>Content: getContent(contentId)
    Content->>UI: Return full content
    UI->>Viewer: Display content
```

These sequence diagrams illustrate the key user flows and system interactions for content management, NFT minting, token gating, and payment processing within our Web3 Streaming Platform.