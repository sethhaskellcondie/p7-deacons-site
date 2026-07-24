import './style.css';

const app = document.querySelector<HTMLDivElement>('#app');

if (app) {
  app.innerHTML = `
    <main>
      <h1>Hello World</h1>
      <p>Welcome to the Deacons site.</p>
    </main>
  `;
}
