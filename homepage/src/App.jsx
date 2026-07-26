import Header from "./components/Header"
import Hero from "./components/Hero"
import HowItWorks from "./components/HowItWorks"
import Categories from "./components/Categories"
import Pricing from "./components/Pricing"
import About from "./components/About"
import Contact from "./components/Contact"
import Footer from "./components/Footer"

export default function App() {
  return (
    <div className="min-h-screen bg-base">
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <Categories />
        <Pricing />
        <About />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}