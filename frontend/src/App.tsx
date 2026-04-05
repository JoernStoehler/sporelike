import { useState } from 'react'
import './App.css'

const MENU = [
  { name: 'The Segfault', desc: 'Espresso so strong it crashes your morning', price: '$4.99' },
  { name: 'Null Pointer Latte', desc: 'Smooth until it unexpectedly fails you', price: '$5.49' },
  { name: 'Infinite Loop Cold Brew', desc: 'You keep drinking and it never ends', price: '$6.00' },
]

function App() {
  const [ordered, setOrdered] = useState(false)

  function handleOrder() {
    setOrdered(true)
    alert('Order placed! Your bugs will be ready shortly.')
  }

  return (
    <div className="shop">
      <header>
        <div className="logo">☕</div>
        <h1>Cup O' Code Coffee Shop</h1>
        <p className="tagline">Fueling developers since compile time</p>
      </header>

      <main>
        <h2>Today's Menu</h2>
        <ul className="menu">
          {MENU.map((item) => (
            <li key={item.name} className="menu-item">
              <div className="item-info">
                <span className="item-name">{item.name}</span>
                <span className="item-desc">{item.desc}</span>
              </div>
              <span className="item-price">{item.price}</span>
            </li>
          ))}
        </ul>

        <button
          className={`order-btn ${ordered ? 'ordered' : ''}`}
          onClick={handleOrder}
          disabled={ordered}
        >
          {ordered ? 'Order Placed!' : 'Place Order'}
        </button>

        {ordered && (
          <p className="order-status">
            Brewing your existential crisis... please hold.
          </p>
        )}
      </main>

      <footer>
        <p>© 2024 Cup O' Code · placeholder content · not a real coffee shop</p>
      </footer>
    </div>
  )
}

export default App
