<template>
  <div class="login-form-container">
    <h1 class="login-form-title">Login</h1>
    <form class="login-form" v-on:submit.prevent="handleLogin">
      <label class="login-form-label" for="email">
        Email:
        <input class="login-form-input" id="email" type="text" v-model="email" required>
      </label>
      <label class="login-form-label" for="password">
        Password:
        <input class="login-form-input" id="password" type="password" v-model="password" required>
      </label>
      <button class="login-form-button" type="submit">Login</button>
    </form>
  </div>
</template>

<script>
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import app from "../FirebaseService"
const auth = getAuth(app);

export default {
  name: 'LoginForm',
  data() {
    return {
      email: '',
      password: ''
    }
  },
  methods: {
    handleLogin() {
      signInWithEmailAndPassword(auth, this.email, this.password)
        .then((userCredential) => {
          console.log('successfully logged in');
          console.log(userCredential.user)
        })
        .catch((error) => {
          alert(error.message);
        })
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.login-form-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.login-form-title {
  font-size: 2rem;
  margin-bottom: 2rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.login-form-label {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  font-family: 'Montserrat', sans-serif;
}

.login-form-input {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 0.25rem;
}

.login-form-button {
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
}

.login-form-button:hover {
  background-color: #0069d9;
}

/* Import Montserrat font */
@import url('https://fonts.googleapis.com/css?family=Montserrat&display=swap');
</style>