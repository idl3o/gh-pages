/**
 * Content Loader
 *
 * Handles dynamic content loading for the streaming platform
 */

document.addEventListener('DOMContentLoaded', function () {
  const contentGrid = document.getElementById('trending-content-grid');

  // Sample content data
  const sampleContent = [
    {
      id: 'content-1',
      title: 'The Future of DeFi Explained',
      creator: 'CryptoExpert',
      thumbnail: 'https://picsum.photos/seed/defi/300/160',
      views: 24500,
      tokens: 1250
    },
    {
      id: 'content-2',
      title: 'Blockchain Gaming Revolution',
      creator: 'GameChainPro',
      thumbnail: 'https://picsum.photos/seed/gaming/300/160',
      views: 18300,
      tokens: 930
    },
    {
      id: 'content-3',
      title: 'NFT Art Collection Showcase',
      creator: 'CryptoArtist',
      thumbnail: 'https://picsum.photos/seed/nft/300/160',
      views: 32100,
      tokens: 2100
    }
  ];

  function loadTrendingContent() {
    if (contentGrid) {
      contentGrid.innerHTML = '';
      sampleContent.forEach(content => {
        const card = createContentCard(content);
        contentGrid.appendChild(card);
      });
    }
  }

  function createContentCard(content) {
    const card = document.createElement('div');
    card.className = 'content-card';
    card.innerHTML = `
      <div class="content-thumbnail" style="background-image: url('${content.thumbnail}')"></div>
      <div class="content-info">
        <h3 class="content-title">${content.title}</h3>
        <div class="content-stats">
          <span>${content.views} views</span>
          <span>${content.tokens} tokens</span>
        </div>
      </div>
    `;
    return card;
  }

  // Load content with a small delay to simulate network request
  setTimeout(loadTrendingContent, 1000);
});
