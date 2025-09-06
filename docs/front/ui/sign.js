(function () {
    let currentModal = null;

    async function sign_window(){
        return new Promise((resolve, reject) => {
            // Create modal
            const modal = document.createElement("div");
            modal.id = "signModal";
            modal.className = "modal";

            // Create modal content
            const modalContent = document.createElement("div");
            modalContent.className = "modal-content";

            // Create form
            const form = document.createElement("form");
            form.id = "signForm";

            // Create username input group
            const usernameGroup = document.createElement("div");
            usernameGroup.className = "input-group";
            const usernameLabel = document.createElement("label");
            usernameLabel.htmlFor = "username";
            usernameLabel.textContent = "Username";
            const usernameInput = document.createElement("input");
            usernameInput.type = "text";
            usernameInput.id = "username";
            usernameInput.name = "username";
            usernameInput.required = true;
            usernameGroup.appendChild(usernameLabel);
            usernameGroup.appendChild(usernameInput);

            // Create password input group
            const passwordGroup = document.createElement("div");
            passwordGroup.className = "input-group";
            const passwordLabel = document.createElement("label");
            passwordLabel.htmlFor = "password";
            passwordLabel.textContent = "Password";
            const passwordInput = document.createElement("input");
            passwordInput.type = "password";
            passwordInput.id = "password";
            passwordInput.name = "password";
            passwordInput.required = true;
            passwordGroup.appendChild(passwordLabel);
            passwordGroup.appendChild(passwordInput);

            // Create button group
            const buttonGroup = document.createElement("div");
            buttonGroup.className = "button-group";
            const signupBtn = document.createElement("button");
            signupBtn.type = "button";
            signupBtn.id = "signupBtn";
            signupBtn.textContent = "Sign Up";
            const signinBtn = document.createElement("button");
            signinBtn.type = "button";
            signinBtn.id = "signinBtn";
            signinBtn.textContent = "Sign In";
            buttonGroup.appendChild(signupBtn);
            buttonGroup.appendChild(signinBtn);

            // Append elements to form
            form.appendChild(usernameGroup);
            form.appendChild(passwordGroup);
            form.appendChild(buttonGroup);

            // Append elements to modal content
            modalContent.appendChild(form);

            // Append modal content to modal
            modal.appendChild(modalContent);

            // Append modal to body
            document.body.appendChild(modal);

            // Store reference to modal
            currentModal = modal;

            // Show modal
            modal.style.display = "block";

            // Handle signin
            signinBtn.onclick = async function() {
                const username = document.getElementById("username").value;
                const password = document.getElementById("password").value;
                try {
                    const data = await window.api.signin(username, password);
                    if (data.token) {
                        localStorage.setItem('token', data.token);
                        hide_window();
                        notebook.info("Success! Welcome to Notebook.");
                        resolve(data.token);
                    } else {
                        notebook.info("Signin failed! Please try again.");
                    }
                } catch (error) {
                    console.error('Signin error:', error);
                    notebook.info("Signin failed! Please try again.");
                }
            };

            // Handle signup
            signupBtn.onclick = async function() {
                const username = document.getElementById("username").value;
                const password = document.getElementById("password").value;
                try {
                    const data = await window.api.signup(username, password);
                    if (data.token) {
                        localStorage.setItem('token', data.token);
                        hide_window();
                        notebook.info("Success! Welcome to Notebook.");
                        resolve(data.token);
                    } else {
                        notebook.info("Signup failed! Please try again.");
                    }
                } catch (error) {
                    console.error('Signup error:', error);
                    notebook.info("Signup failed! Please try again.");
                }
            };
        });
    }

    function hide_window() {
        if (currentModal) {
            currentModal.style.display = "none";
            if (currentModal.parentNode) {
                currentModal.parentNode.removeChild(currentModal);
            }
            currentModal = null;
        }
    }

    async function setup_sign(){
        // Check if user is already authenticated
        const storedToken = localStorage.getItem('token');
        if (storedToken !== null) {
            const checkResult = await window.api.check(storedToken);
            if (checkResult.success) {
                return storedToken; // Return existing valid token
            }
        }
        
        // If not authenticated or token is invalid, show sign window
        try {
            const token = await sign_window();
            return token; // Return the new token after successful authentication
        } catch (error) {
            console.error('Authentication error:', error);
            throw error; // Re-throw the error for the caller to handle
        }
    }
    notebook.setup_sign = setup_sign;
    notebook.hide_sign_window = hide_window;
})()