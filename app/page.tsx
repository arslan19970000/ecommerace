import Navbar from "@/components/homepage/Navbar"
import { ShoppingCart, Store, Users } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <h1 className="text-5xl font-bold mb-6">
          Welcome to <span className="text-yellow-300">MyEcom</span>
        </h1>
        <p className="max-w-2xl text-lg mb-8">
          A simple marketplace where buyers and sellers connect.  
          Register today and start your journey!
        </p>
        <div className="flex gap-4">
          <a
            href="/auth/signUp"
            className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300"
          >
            Get Started
          </a>
          <a
            href="/auth/login"
            className="border border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600"
          >
            Login
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-100">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-10">Why Choose MyEcom?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <ShoppingCart className="h-10 w-10 mx-auto text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Easy Shopping</h3>
              <p className="text-gray-600">Buy products in just a few clicks.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Store className="h-10 w-10 mx-auto text-green-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Sell Easily</h3>
              <p className="text-gray-600">List and manage your products seamlessly.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Users className="h-10 w-10 mx-auto text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Community</h3>
              <p className="text-gray-600">Join a growing network of buyers & sellers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6 text-center">
        <p>&copy; {new Date().getFullYear()} MyEcom. All rights reserved.</p>
      </footer>
    </div>
  )
}
