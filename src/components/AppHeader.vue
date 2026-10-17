<template>
  <header class="header">
    <RouterLink to="/" class="brand"><span aria-hidden="true">🎮</span> Spelportalen</RouterLink>
    <nav aria-label="Huvudmeny">
      <RouterLink to="/#spel">Alla spel</RouterLink>
    </nav>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 1.25rem;
  background: rgb(15 23 42 / 92%);
  backdrop-filter: blur(8px);
}
.brand {
  color: #fff;
  font-size: 1.1rem;
  font-weight: 800;
  text-decoration: none;
}
nav a {
  color: #cbd5e1;
  text-decoration: none;
  font-weight: 600;
}
nav a:hover {
  color: #fff;
}
</style>
