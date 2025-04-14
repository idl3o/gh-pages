/**
 * Panpsychism Page Functionality
 * Interactive elements for exploring panpsychism concepts
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize consciousness scale explorer
    initConsciousnessExplorer();
    
    // Set up theory modal popups
    initTheoryModals();
    
    // Set up interactive spectrum
    initConsciousnessSpectrum();
});

/**
 * Initialize the consciousness scale explorer
 */
function initConsciousnessExplorer() {
    const scaleSlider = document.getElementById('consciousness-scale');
    const levelDisplay = document.getElementById('level-display');
    const levelDescription = document.getElementById('level-description');
    const visualizationEl = document.getElementById('consciousness-viz');
    
    if (!scaleSlider || !levelDisplay || !levelDescription || !visualizationEl) return;
    
    // Define level data
    const levels = [
        {
            name: "Subatomic",
            description: "At the subatomic level, panpsychism might suggest that elementary particles possess some rudimentary form of experience or proto-consciousness, perhaps related to their quantum properties such as spin or charge.",
            particleCount: 150,
            particleSpeed: 3,
            particleSize: 2,
            background: "linear-gradient(135deg, #1a202c, #2d3748)"
        },
        {
            name: "Molecular",
            description: "At the molecular level, complex arrangements of atoms could give rise to more integrated forms of experience, with chemical bonds representing rudimentary 'preferences' or 'attractions' between elements.",
            particleCount: 60,
            particleSpeed: 2,
            particleSize: 5,
            background: "linear-gradient(135deg, #2a4365, #3182ce)"
        },
        {
            name: "Cellular",
            description: "At the cellular level, panpsychism might suggest that individual cells possess a proto-consciousness or primitive form of experience, responding to their environment in ways that go beyond mere mechanical reactions.",
            particleCount: 20,
            particleSpeed: 1.5,
            particleSize: 12,
            background: "linear-gradient(135deg, #276749, #48bb78)"
        },
        {
            name: "Organism",
            description: "At the organism level, consciousness becomes recognizable as unified experience, with subjective perception and feeling. The integrated nature of multi-cellular organisms allows for complex forms of consciousness that we more readily recognize.",
            particleCount: 8,
            particleSpeed: 1,
            particleSize: 30,
            background: "linear-gradient(135deg, #44337a, #9f7aea)"
        },
        {
            name: "Cosmic",
            description: "At the cosmic level, some theorists propose that the universe itself might possess a form of consciousness. This cosmic consciousness might encompass and integrate all lower forms of consciousness within it.",
            particleCount: 1,
            particleSpeed: 0.5,
            particleSize: 100,
            background: "linear-gradient(135deg, #702459, #ed64a6)"
        }
    ];
    
    // Initialize with middle value
    updateConsciousnessVisualization(2);
    
    // Add event listener for slider changes
    scaleSlider.addEventListener('input', function() {
        const levelIndex = parseInt(this.value) - 1;
        updateConsciousnessVisualization(levelIndex);
    });
    
    /**
     * Update the consciousness visualization based on level
     * @param {number} levelIndex - Index of consciousness level (0-4)
     */
    function updateConsciousnessVisualization(levelIndex) {
        const level = levels[levelIndex];
        
        // Update display text
        levelDisplay.textContent = level.name;
        levelDescription.textContent = level.description;
        
        // Update visualization
        visualizationEl.style.background = level.background;
        
        // Clear existing particles
        const particlesContainer = visualizationEl.querySelector('.consciousness-particles');
        particlesContainer.innerHTML = '';
        
        // Create new particles
        for (let i = 0; i < level.particleCount; i++) {
            createParticle(particlesContainer, level.particleSize, level.particleSpeed);
        }
    }
    
    /**
     * Create a consciousness particle
     * @param {HTMLElement} container - Container element
     * @param {number} size - Particle size
     * @param {number} speed - Animation speed
     */
    function createParticle(container, size, speed) {
        const particle = document.createElement('div');
        particle.className = 'consciousness-particle';
        
        // Random position
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        
        // Random animation duration
        const duration = (5 / speed) + (Math.random() * 10);
        
        // Set styles
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background-color: rgba(255, 255, 255, 0.7);
            border-radius: 50%;
            left: ${left}%;
            top: ${top}%;
            animation: float ${duration}s infinite ease-in-out;
        `;
        
        container.appendChild(particle);
    }
}

/**
 * Initialize theory modal popups
 */
function initTheoryModals() {
    const learnMoreButtons = document.querySelectorAll('.learn-more');
    const modal = document.getElementById('theory-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeModalButton = document.querySelector('.close-modal');
    
    if (!modal || !modalTitle || !modalBody) return;
    
    // Theory data
    const theories = {
        constitutive: {
            title: "Constitutive Panpsychism",
            content: `
                <p>Constitutive panpsychism holds that macro-consciousness (like human experience) is constituted by micro-consciousness at a more fundamental level.</p>
                
                <h3>Key Points:</h3>
                <ul>
                    <li>The consciousness of the whole derives from the consciousness of its parts</li>
                    <li>Elementary particles or their fundamental constituents possess some form of proto-consciousness</li>
                    <li>These proto-conscious entities combine to form the unified consciousness we experience</li>
                </ul>
                
                <h3>The Combination Problem:</h3>
                <p>The main challenge for constitutive panpsychism is explaining how many micro-conscious entities combine to form a single unified consciousness. This is known as "the combination problem."</p>
                
                <p>Philosophers like Galen Strawson and David Chalmers have explored various approaches to this problem, including fusion models (where micro-consciousnesses literally fuse into a unified whole) and phenomenal bonding (where micro-consciousnesses are bound together by special relations).</p>
                
                <h3>Leading Proponents:</h3>
                <p>Galen Strawson, Sam Coleman, and Luke Roelofs are among the contemporary philosophers who have developed sophisticated versions of constitutive panpsychism.</p>
            `
        },
        russellian: {
            title: "Russellian Monism",
            content: `
                <p>Russellian Monism is named after philosopher Bertrand Russell, who suggested that physics tells us only about the relational structure of the world, not about its intrinsic nature.</p>
                
                <h3>Key Points:</h3>
                <ul>
                    <li>Physics describes extrinsic, structural, or dispositional properties</li>
                    <li>These properties must have some intrinsic nature that realizes them</li>
                    <li>Consciousness or proto-consciousness might be this intrinsic nature</li>
                    <li>This provides a causal role for consciousness in the physical world</li>
                </ul>
                
                <h3>Variations:</h3>
                <p><strong>Russellian Panpsychism:</strong> The intrinsic nature of physical reality is consciousness or proto-consciousness all the way down to the most fundamental level.</p>
                
                <p><strong>Russellian Panprotopsychism:</strong> The intrinsic nature isn't consciousness itself but proto-conscious properties that can give rise to consciousness in certain configurations.</p>
                
                <h3>Solving the Hard Problem:</h3>
                <p>Russellian Monism attempts to solve the hard problem of consciousness by placing consciousness (or proto-consciousness) within the causal structure of the physical world, rather than as an emergent property that would be epiphenomenal.</p>
                
                <h3>Leading Proponents:</h3>
                <p>David Chalmers, Galen Strawson, and Philip Goff have developed various forms of Russellian Monism in their work.</p>
            `
        },
        cosmopsychism: {
            title: "Cosmopsychism",
            content: `
                <p>Cosmopsychism is a "top-down" approach to panpsychism that proposes consciousness exists at the cosmic level first and foremost.</p>
                
                <h3>Key Points:</h3>
                <ul>
                    <li>The universe as a whole is conscious or proto-conscious</li>
                    <li>Individual consciousnesses derive from cosmic consciousness through a process of decomposition</li>
                    <li>Reverses the normal constitutive relationship</li>
                </ul>
                
                <h3>The Decomposition Problem:</h3>
                <p>Rather than a combination problem, cosmopsychism faces a "decomposition problem": how does the unified cosmic consciousness give rise to the seemingly separate individual consciousnesses that we experience?</p>
                
                <h3>Relation to Ancient Thought:</h3>
                <p>Cosmopsychism resonates with ancient philosophical and religious traditions like Advaita Vedanta in Hinduism, which posits a universal consciousness (Brahman) from which individual consciousness (Atman) derives.</p>
                
                <h3>Leading Proponents:</h3>
                <p>Philip Goff, Itay Shani, and Yujin Nagasawa have developed sophisticated cosmopsychist theories in recent philosophical literature.</p>
            `
        },
        integrated: {
            title: "Integrated Information Theory",
            content: `
                <p>Integrated Information Theory (IIT) is a scientific theory of consciousness developed by neuroscientist Giulio Tononi that has panpsychist implications.</p>
                
                <h3>Key Points:</h3>
                <ul>
                    <li>Consciousness corresponds to integrated information in a system</li>
                    <li>The measure of integrated information is called Phi (Φ)</li>
                    <li>Any system with non-zero Phi has some degree of consciousness</li>
                    <li>The quality and intensity of conscious experience depends on the specific pattern and amount of integrated information</li>
                </ul>
                
                <h3>Scientific Framework:</h3>
                <p>Unlike traditional philosophical approaches to panpsychism, IIT provides a mathematical framework for potentially measuring consciousness, giving it a more scientific character.</p>
                
                <h3>Implications:</h3>
                <p>IIT implies that consciousness exists on a continuum, with humans and complex animals having high levels of consciousness, while simple organisms and even some sophisticated computers might have minimal but non-zero consciousness.</p>
                
                <h3>Leading Proponents:</h3>
                <p>Giulio Tononi, Christof Koch, and Masafumi Oizumi are the principal developers of Integrated Information Theory and its mathematical framework.</p>
            `
        }
    };
    
    // Add click event listeners to "Learn More" buttons
    learnMoreButtons.forEach(button => {
        button.addEventListener('click', function() {
            const theory = this.getAttribute('data-theory');
            if (theories[theory]) {
                modalTitle.textContent = theories[theory].title;
                modalBody.innerHTML = theories[theory].content;
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden'; // Prevent scrolling
            }
        });
    });
    
    // Close modal when X is clicked
    if (closeModalButton) {
        closeModalButton.addEventListener('click', function() {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
        });
    }
    
    // Close modal when clicking outside content
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.style.display === 'flex') {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
        }
    });
}

/**
 * Initialize consciousness spectrum interaction
 */
function initConsciousnessSpectrum() {
    const spectrumItems = document.querySelectorAll('.spectrum-item');
    
    spectrumItems.forEach(item => {
        item.addEventListener('click', function() {
            const level = this.getAttribute('data-level');
            
            // Map level to slider value
            const levelMap = {
                'subatomic': 1,
                'molecular': 2,
                'cellular': 3,
                'organism': 4,
                'cosmic': 5
            };
            
            if (levelMap[level]) {
                const slider = document.getElementById('consciousness-scale');
                if (slider) {
                    slider.value = levelMap[level];
                    
                    // Trigger input event to update visualization
                    const event = new Event('input');
                    slider.dispatchEvent(event);
                    
                    // Smooth scroll to visualization
                    document.getElementById('consciousness-viz')?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
            }
        });
    });
}
