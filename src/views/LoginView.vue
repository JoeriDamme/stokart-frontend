<template>
  <div class="login-container">
    <div class="login-card">
      <h1>Login</h1>
      <p class="subtitle">Access your loyalty cards</p>
      <p style="text-align: center; color: #666; margin-top: 20px;">
        Login view - To be implemented in US-1.2
      </p>
      <p class="register-link">
        Don't have an account?
        <router-link to="/register">Register here</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 450px;
}

h1 {
  margin: 0 0 10px;
  font-size: 28px;
  color: #333;
  text-align: center;
}

.subtitle {
  margin: 0 0 30px;
  color: #666;
  text-align: center;
  font-size: 14px;
}

.register-link {
  margin-top: 20px;
  text-align: center;
  color: #666;
  font-size: 14px;
}

.register-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.register-link a:hover {
  text-decoration: underline;
}
</style>
