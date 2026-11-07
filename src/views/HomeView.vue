<script setup lang="ts">
import { computed } from 'vue'
import GameCard from '@/components/GameCard.vue'
import { categories, gamePath, games } from '@/games/registry'

const playable = computed(() => games.filter((g) => g.status === 'available'))
const featured = computed(() => playable.value[0]!)

const features = [
  {
    icon: '🧠',
    title: 'Smarta hjälpmedel',
    text: 'Tips som förklarar tekniken steg för steg i sudoku.',
  },
  { icon: '📷', title: 'Skanna tidningen', text: 'Fota ett sudoku och spela det digitalt direkt.' },
  {
    icon: '🤝',
    title: 'Spela tillsammans',
    text: 'Mot datorn, en vän på samma enhet eller online.',
  },
  {
    icon: '🆓',
    title: 'Gratis & utan konto',
    text: 'Ingen registrering, inga annonser. Öppna och spela.',
  },
]
</script>

<template>
  <main>
    <section class="hero">
      <div class="inner">
        <p class="eyebrow">Spelportalen</p>
        <h1>Ett hem för alla dina favoritspel</h1>
        <p class="lead">
          Sudoku, patienser och brädspel på ett ställe – direkt i webbläsaren, på mobil och dator.
          Inget att installera.
        </p>
        <div class="actions">
          <RouterLink :to="gamePath(featured)" class="primary"
            >Spela {{ featured.title }}</RouterLink
          >
          <a href="#spel" class="secondary">Se alla spel</a>
        </div>
        <ul class="stats" aria-label="Sammanfattning">
          <li>
            <strong>{{ playable.length }}</strong> spel
          </li>
          <li>
            <strong>{{ categories.length }}</strong> kategorier
          </li>
          <li><strong>0 kr</strong> för alltid</li>
        </ul>
      </div>
    </section>

    <section id="spel" class="games">
      <div v-for="category in categories" :key="category.id" class="category">
        <h2>{{ category.title }}</h2>
        <p class="sub">{{ category.description }}</p>
        <div class="grid">
          <GameCard
            v-for="g in games.filter((x) => x.category === category.id)"
            :key="g.id"
            :game="g"
          />
        </div>
      </div>
    </section>

    <section class="features" aria-label="Därför Spelportalen">
      <h2>Därför Spelportalen</h2>
      <ul>
        <li v-for="f in features" :key="f.title">
          <span class="ficon" aria-hidden="true">{{ f.icon }}</span>
          <strong>{{ f.title }}</strong>
          <span>{{ f.text }}</span>
        </li>
      </ul>
    </section>

    <footer class="footer">© Spelportalen · Spela gratis direkt i webbläsaren.</footer>
  </main>
</template>

<style scoped>
.hero {
  padding: 4rem 1rem 3.5rem;
  color: #fff;
  text-align: center;
  background:
    radial-gradient(circle at 20% 20%, rgb(139 92 246 / 55%), transparent 45%),
    radial-gradient(circle at 80% 70%, rgb(14 165 233 / 45%), transparent 45%),
    linear-gradient(135deg, #1e1b4b, #0f172a);
}
.inner {
  max-width: 44rem;
  margin: 0 auto;
}
.eyebrow {
  margin: 0;
  color: #a5b4fc;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 0.8rem;
}
h1 {
  margin: 0.5rem 0 1rem;
  font-size: clamp(2rem, 6vw, 3.4rem);
  line-height: 1.1;
}
.lead {
  margin: 0 auto 1.8rem;
  max-width: 34rem;
  color: #cbd5e1;
  font-size: 1.1rem;
  line-height: 1.5;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
}
.primary,
.secondary {
  padding: 0.8rem 1.6rem;
  border-radius: 999px;
  font-weight: 700;
  text-decoration: none;
}
.primary {
  background: #fff;
  color: #3730a3;
  box-shadow: 0 6px 20px rgb(0 0 0 / 30%);
}
.secondary {
  border: 2px solid rgb(255 255 255 / 50%);
  color: #fff;
}
.stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin: 2.2rem 0 0;
  padding: 0;
  list-style: none;
  color: #cbd5e1;
}
.stats strong {
  color: #fff;
  font-size: 1.3rem;
}
.games,
.features {
  max-width: 70rem;
  margin: 0 auto;
  padding: 2.5rem 1rem 0;
}
.category h2,
.features h2 {
  margin: 0;
  font-size: 1.6rem;
}
.sub {
  margin: 0.2rem 0 1rem;
  color: #64748b;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
}
.features ul {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 1rem;
  margin: 1.2rem 0 0;
  padding: 0;
  list-style: none;
}
.features li {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 1.2rem;
  border-radius: 1rem;
  background: #fff;
  color: #475569;
  box-shadow: 0 1px 3px rgb(15 23 42 / 10%);
}
.features li strong {
  color: #111827;
}
.ficon {
  font-size: 1.8rem;
}
.footer {
  margin-top: 3rem;
  padding: 1.5rem 1rem;
  background: #0f172a;
  color: #94a3b8;
  text-align: center;
  font-size: 0.9rem;
}
</style>
