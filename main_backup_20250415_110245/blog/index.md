- --
layout: default
title: Blog & Articles
description: Latest insights, updates and educational content about Web3 streaming technology
permalink: /blog/
- --

# Blog & Articles

Stay updated with the latest developments in Web3 streaming technology, crypto trends, and platform announcements.

<div class="blog-filter">
  <button class="filter-button active" data-filter="all">All Posts</button>
  <button class="filter-button" data-filter="technology">Technology</button>
  <button class="filter-button" data-filter="tutorials">Tutorials</button>
  <button class="filter-button" data-filter="updates">Platform Updates</button>
  <button class="filter-button" data-filter="creators">Creator Insights</button>
</div>

<div class="blog-grid" id="blog-grid">
  {% for post in site.posts %}
    <article class="blog-card animate-on-scroll" data-animation="fadeInUp" data-category="{{ post.categories | join: ' ' }}">
      <div class="blog-card-image">
        {% if post.image %}
          <img src="{{ post.image | relative_url }}" alt="{{ post.title }}">
        {% else %}
          <div class="blog-placeholder-image">
            <div class="placeholder-icon">✍️</div>
          </div>
        {% endif %}
      </div>
      <div class="blog-card-content">
        <div class="blog-meta">
          <span class="blog-date">{{ post.date | date: "%B %d, %Y" }}</span>
          {% if post.categories %}
            <span class="blog-categories">
              {% for category in post.categories %}
                <span class="blog-category">{{ category }}</span>
              {% endfor %}
            </span>
          {% endif %}
        </div>
        <h2 class="blog-title">{{ post.title }}</h2>
        <p class="blog-excerpt">{{ post.excerpt | strip_html | truncatewords: 30 }}</p>
        <a href="{{ post.url | relative_url }}" class="blog-read-more">Read More →</a>
      </div>
    </article>
  {% endfor %}
</div>

<div class="blog-empty hidden" id="blog-empty">
  <p>No articles found in this category. Check back soon!</p>
</div>

<div class="blog-newsletter">
  <h3>Subscribe for Updates</h3>
  <p>Get the latest articles and updates delivered directly to your inbox.</p>
  <form class="newsletter-form" action="#" method="post">
    <input type="email" placeholder="Your email address" required>
    <button type="submit" class="button primary">Subscribe</button>
  </form>
</div>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    // Blog filtering functionality
    const filterButtons = document.querySelectorAll('.filter-button');
    const blogCards = document.querySelectorAll('.blog-card');
    const blogGrid = document.getElementById('blog-grid');
    const emptyMessage = document.getElementById('blog-empty');
    
    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Update active button
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Get selected filter
        const filter = button.getAttribute('data-filter');
        
        // Filter blog posts
        let visibleCount = 0;
        
        blogCards.forEach(card => {
          if (filter === 'all' || card.getAttribute('data-category').includes(filter)) {
            card.classList.remove('hidden');
            visibleCount++;
          } else {
            card.classList.add('hidden');
          }
        });
        
        // Show/hide empty message
        if (visibleCount === 0) {
          emptyMessage.classList.remove('hidden');
        } else {
          emptyMessage.classList.add('hidden');
        }
      });
    });
  });
</script>

<style>
  .blog-filter {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 2rem 0;
  }
  
  .filter-button {
    background-color: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--text-on-dark);
    padding: 0.5rem 1rem;
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .filter-button:hover {
    background-color: rgba(110, 69, 226, 0.2);
    border-color: rgba(110, 69, 226, 0.3);
  }
  
  .filter-button.active {
    background-color: var(--primary);
    border-color: var(--primary);
    color: var(--light-color);
  }
  
  .blog-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 2rem;
    margin: 2rem 0;
  }
  
  .blog-card {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: var(--border-radius);
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .blog-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
  }
  
  .blog-card-image {
    height: 200px;
    overflow: hidden;
    position: relative;
  }
  
  .blog-card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }
  
  .blog-card:hover .blog-card-image img {
    transform: scale(1.05);
  }
  
  .blog-placeholder-image {
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, var(--primary), var(--secondary));
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .placeholder-icon {
    font-size: 3rem;
    color: rgba(255, 255, 255, 0.8);
  }
  
  .blog-card-content {
    padding: 1.5rem;
  }
  
  .blog-meta {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
    font-size: 0.9rem;
    color: var(--text-muted-on-dark);
  }
  
  .blog-categories {
    display: flex;
    gap: 0.5rem;
  }
  
  .blog-category {
    background-color: rgba(110, 69, 226, 0.2);
    color: var(--primary-light);
    padding: 0.2rem 0.5rem;
    border-radius: 3px;
    font-size: 0.8rem;
  }
  
  .blog-title {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: var(--light-color);
  }
  
  .blog-excerpt {
    color: var(--text-on-dark);
    margin-bottom: 1.5rem;
    line-height: 1.6;
  }
  
  .blog-read-more {
    color: var(--secondary);
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s ease;
  }
  
  .blog-read-more:hover {
    color: var(--secondary-light);
  }
  
  .blog-empty {
    text-align: center;
    padding: 3rem;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: var(--border-radius);
    color: var(--text-muted-on-dark);
  }
  
  .blog-newsletter {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: var(--border-radius);
    padding: 2rem;
    margin-top: 3rem;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .blog-newsletter h3 {
    margin-bottom: 1rem;
    color: var(--light-color);
  }
  
  .hidden {
    display: none !important;
  }
  
  @media (max-width: 768px) {
    .blog-grid {
      grid-template-columns: 1fr;
    }
    
    .blog-filter {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>

