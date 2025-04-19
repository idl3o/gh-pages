<<<<<<< Updated upstream
/**
 * Content Loader
 *
 * Handles dynamic content loading for the streaming platform
 */

document.addEventListener('DOMContentLoaded', function() {
  // Load trending content
  loadTrendingContent();

  // Mock data for trending content
  function loadTrendingContent() {
    const contentGrid = document.getElementById('trending-content-grid');
    if (!contentGrid) return;

    // Clear placeholder
    contentGrid.innerHTML = '';

    // Mock content data
    const trendingContent = [
      {
        title: 'Introduction to Web3',
        creator: 'Alice Nakamoto',
        duration: '23:45',
        views: '15.3K',
        thumbnail: 'assets/images/placeholder-1.jpg',
        category: 'Education'
      },
      {
        title: 'Building Smart Contracts',
        creator: 'Bob Chen',
        duration: '42:12',
        views: '8.7K',
        thumbnail: 'assets/images/placeholder-2.jpg',
        category: 'Development'
      },
      {
        title: 'Crypto Economics Explained',
        creator: 'Charlie Buterin',
        duration: '18:30',
        views: '12.4K',
        thumbnail: 'assets/images/placeholder-3.jpg',
        category: 'Finance'
      },
      {
        title: 'Decentralized Storage Systems',
        creator: 'Dave Pinckney',
        duration: '33:27',
        views: '5.2K',
        thumbnail: 'assets/images/placeholder-4.jpg',
        category: 'Technology'
      }
    ];

    // Generate content cards
    trendingContent.forEach(content => {
      const card = document.createElement('div');
      card.className = 'content-card';

      // Using a placeholder image if actual thumbnail isn't found
      const imageSrc = `/assets/images/placeholder-content.jpg`;

      card.innerHTML = `
        <div class="content-thumbnail">
          <img src="${imageSrc}" alt="${content.title}">
          <span class="content-duration">${content.duration}</span>
=======
document.addEventListener('DOMContentLoaded', function () {
  const contentGrid = document.getElementById('trending-content-grid');

  // Sample content data (in a real app, this would come from blockchain/API)
  const sampleContent = [
    {
      id: 'content-1',
      title: 'The Future of DeFi Explained',
      creator: 'CryptoExpert',
      creatorAddress: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
      thumbnail: 'https://picsum.photos/seed/defi/300/160',
      views: 24500,
      tokens: 1250
    },
    {
      id: 'content-2',
      title: 'NFT Creation Workshop',
      creator: 'ArtisticBlockchain',
      creatorAddress: '0x1234567890123456789012345678901234567890',
      thumbnail: 'https://picsum.photos/seed/nft/300/160',
      views: 18300,
      tokens: 890
    },
    {
      id: 'content-3',
      title: 'Smart Contract Security Tips',
      creator: 'Web3Developer',
      creatorAddress: '0x2345678901234567890123456789012345678901',
      thumbnail: 'https://picsum.photos/seed/security/300/160',
      views: 32100,
      tokens: 1560
    },
    {
      id: 'content-4',
      title: 'Metaverse Gaming Review',
      creator: 'CryptoGamer',
      creatorAddress: '0x3456789012345678901234567890123456789012',
      thumbnail: 'https://picsum.photos/seed/metaverse/300/160',
      views: 12800,
      tokens: 780
    },
    {
      id: 'content-5',
      title: 'Tokenomics Deep Dive',
      creator: 'CryptoEconomist',
      creatorAddress: '0x4567890123456789012345678901234567890123',
      thumbnail: 'https://picsum.photos/seed/tokenomics/300/160',
      views: 19700,
      tokens: 1120
    },
    {
      id: 'content-6',
      title: 'DAO Governance Models',
      creator: 'BlockchainGovernance',
      creatorAddress: '0x5678901234567890123456789012345678901234',
      thumbnail: 'https://picsum.photos/seed/dao/300/160',
      views: 15600,
      tokens: 950
    }
  ];

  // Load content into grid
  function loadTrendingContent() {
    // Clear loading placeholder
    if (contentGrid) {
      contentGrid.innerHTML = '';

      // Generate content cards
      sampleContent.forEach(content => {
        const card = createContentCard(content);
        contentGrid.appendChild(card);
      });
    }
  }

  // Create a content card element
  function createContentCard(content) {
    const card = document.createElement('div');
    card.className = 'content-card';
    card.setAttribute('data-id', content.id);

    // Use placeholder images in case actual images are not available
    const thumbnailUrl = content.thumbnail || 'https://via.placeholder.com/300x160';

    card.innerHTML = `
      <div class="content-thumbnail" style="background-image: url('${thumbnailUrl}')"></div>
      <div class="content-info">
        <h3 class="content-title">${content.title}</h3>
        <div class="content-stats">
          <span>${formatNumber(content.views)} views</span>
          <span>${formatNumber(content.tokens)} tokens</span>
>>>>>>> Stashed changes
        </div>
        <div class="content-info">
          <h3>${content.title}</h3>
          <p class="content-creator">${content.creator}</p>
          <div class="content-meta">
            <span class="content-views">${content.views} views</span>
            <span class="content-category">${content.category}</span>
          </div>
        </div>
<<<<<<< Updated upstream
      `;

      contentGrid.appendChild(card);
    });
  }
=======
      </div>
    `;

    // Add click event to view content
    card.addEventListener('click', () => {
      viewContent(content);
    });

    return card;
  }

  // Handle content viewing
  function viewContent(content) {
    console.log('Viewing content:', content);
    // In a real app, this would navigate to the content page or open a video player
    alert(
      `Playing "${content.title}" by ${content.creator}\n\nIn a full implementation, this would open the streaming player.`
    );
  }

  // Format numbers for display (e.g., 1500 -> 1.5K)
  function formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num;
  }

  // Load content with slight delay to simulate API call
  setTimeout(loadTrendingContent, 1000);
>>>>>>> Stashed changes
});
