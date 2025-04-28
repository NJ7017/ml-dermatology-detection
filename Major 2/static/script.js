    document.addEventListener('DOMContentLoaded', function() {
        if (typeof gsap !== 'undefined') {
            gsap.from(".navbar", {
                y: -5,
                duration: 1,
                ease: "back.out(1.2)",
                delay: 0.1
            });
    
            gsap.from(".main-container", {
                y: 5,
                duration: 1,
                ease: "back.out(1.2)",
                delay: 0.1
            });
        }

    // DOM Elements
    const uploadBtn = document.getElementById('upload-btn');
    const predictBtn = document.getElementById('predict-btn');
    const imageUpload = document.getElementById('imageUpload');
    const uploadedImage = document.getElementById('uploadedImage');
    const resultsContainer = document.getElementById('results-container');
    const predictionsContainer = document.getElementById('predictions');
    const uploadContainer = document.querySelector('.upload-container');

    // Event Listeners
    uploadBtn?.addEventListener('click', () => imageUpload.click());
    imageUpload?.addEventListener('change', handleImageUpload);
    predictBtn?.addEventListener('click', handlePrediction);

    // Image Upload Handler
    function handleImageUpload(e) {
        if (e.target.files.length > 0) {
            uploadContainer.classList.add('has-file');
            const reader = new FileReader();
            
            reader.onloadstart = () => {
                uploadBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Uploading...';
                uploadBtn.disabled = true;
            };
            
            reader.onload = function(event) {
                uploadedImage.src = event.target.result;
                uploadedImage.style.display = 'block';
                resultsContainer.style.display = 'none';
                uploadBtn.textContent = 'Change Image';
                uploadBtn.disabled = false;
                
                // Animate image appearance
                if (typeof gsap !== 'undefined') {
                    gsap.from(uploadedImage, {
                        duration: 0.8,
                        scale: 0.8,
                        opacity: 1,
                        ease: "back.out(1.2)"
                    });
                    
                    // Floating animation
                    gsap.to(uploadedImage, {
                        y: -5,
                        duration: 2,
                        repeat: -1,
                        yoyo: true,
                        ease: "sine.inOut"
                    });
                }
            };
            
            reader.onerror = () => {
                uploadBtn.textContent = 'Upload Failed';
                uploadBtn.disabled = false;
                setTimeout(() => {
                    uploadBtn.textContent = 'Choose Image';
                }, 2000);
            };
            
            reader.readAsDataURL(e.target.files[0]);
        }
    }

    // Prediction Handler
    async function handlePrediction() {
        if (!imageUpload.files.length) {
            triggerUploadError();
            return;
        }
        
        try {
            // Set loading state
            predictBtn.disabled = true;
            predictBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Analyzing...';
            
            // Pulse animation on container
            uploadContainer.style.animation = 'pulse 1.5s infinite';
            
            const formData = new FormData();
            formData.append('image', imageUpload.files[0]);
            
            const response = await fetch('/predict', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            displayResults(data);
            
        } catch (error) {
            console.error('Prediction error:', error);
            showError("Prediction failed. Please try again.");
        } finally {
            predictBtn.disabled = false;
            predictBtn.textContent = 'Predict';
            uploadContainer.style.animation = '';
        }
    }

    // Display Results with Animations
    function displayResults(predictions) {
        predictionsContainer.innerHTML = '';
        
        // Convert to array and sort by probability
        const sortedPredictions = Object.entries(predictions)
            .sort((a, b) => b[1] - a[1]);
        
        sortedPredictions.forEach(([disease, probability], index) => {
            const card = createPredictionCard(disease, probability, index);
            predictionsContainer.appendChild(card);
            
            // Animate card appearance
            if (typeof gsap !== 'undefined') {
                gsap.from(card, {
                    duration: 0.6,
                    y: 30,
                    opacity: 1,
                    delay: index * 0.1,
                    ease: "back.out(1.2)"
                });
            }
            
            // Animate progress bar
            setTimeout(() => {
                const progressBar = card.querySelector('.progress-bar');
                if (typeof gsap !== 'undefined') {
                    gsap.to(progressBar, {
                        width: `${probability}%`,
                        duration: 1.5,
                        delay: 0.3 + (index * 0.1),
                        ease: "elastic.out(1, 0.5)",
                        
                    });
                } else {
                    progressBar.style.width = `${probability}%`;
                }
            }, 100);
        });
        
        resultsContainer.style.display = 'block';
        scrollToResults();
        
        // Animate results container
        if (typeof gsap !== 'undefined') {
            gsap.from(resultsContainer, {
                duration: 0.8,
                y: 30,
                opacity: 1,
                ease: "power2.out"
            });
        }
    }

    // Create Prediction Card
    function createPredictionCard(disease, probability, index) {
        const card = document.createElement('div');
        card.className = `prediction-card ${index === 0 ? 'top-prediction' : ''}`;
        
        card.innerHTML = `
            <div class="prediction-name">${formatDiseaseName(disease)}</div>
            <div class="prediction-percent">${probability.toFixed(2)}%</div>
            <div class="progress">
                <div class="progress-bar" 
                     role="progressbar" 
                     style="width: 0%" 
                     aria-valuenow="${probability}" 
                     aria-valuemin="0" 
                     aria-valuemax="100">
                </div>
            </div>
        `;
        
        return card;
    }

    

    // Format Disease Name
    function formatDiseaseName(name) {
        return name
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    // Error Handling
    function triggerUploadError() {
        if (typeof gsap !== 'undefined') {
            gsap.to(uploadBtn, {
                x: [-5, 5, -5, 5, 0],
                duration: 0.5,
                ease: "power1.inOut"
            });
            
            gsap.to(predictBtn, {
                keyframes: [
                    { scale: 1.1, backgroundColor: '#ff6b6b', duration: 0.2 },
                    { scale: 1, backgroundColor: '#198754', duration: 0.3 }
                ]
            });
        } else {
            uploadBtn.classList.add('shake');
            predictBtn.classList.add('pulse-error');
            setTimeout(() => {
                uploadBtn.classList.remove('shake');
                predictBtn.classList.remove('pulse-error');
            }, 500);
        }
    }

    function showError(message) {
        resultsContainer.innerHTML = `
            <div class="error-message">
                <i class="bi bi-exclamation-triangle-fill"></i> ${message}
            </div>
        `;
        resultsContainer.style.display = 'block';
        
        if (typeof gsap !== 'undefined') {
            gsap.from(".error-message", {
                scale: 0.8,
                opacity: 1,
                duration: 0.5,
                ease: "back.out(1.2)"
            });
        }
    }

    // Scroll to Results
    function scrollToResults() {
        setTimeout(() => {
            resultsContainer.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest'
            });
        }, 300);
    }

    // Contact Form Handling
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        if (typeof gsap !== 'undefined') {
            gsap.effects.fadeSlideIn("#contactForm input, #contactForm textarea", {
                stagger: 0.1
            });
        }
        
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (typeof gsap !== 'undefined') {
                gsap.to("#contactForm button", {
                    keyframes: [
                        { scale: 0.9, backgroundColor: '#4cc9f0', duration: 0.2 },
                        { scale: 1, backgroundColor: '#0d6efd', duration: 0.3 }
                    ],
                    onComplete: function() {
                        showSuccessMessage();
                    }
                });
            } else {
                showSuccessMessage();
            }
        });
    }

    function showSuccessMessage() {
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success mt-3';
        successDiv.textContent = 'Thank you for your message! This is a demo form.';
        contactForm.appendChild(successDiv);
        contactForm.reset();
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
});