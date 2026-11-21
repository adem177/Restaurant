import { Outlet } from 'react-router-dom'
import Footer from './Footer'
import Navbar from './Navbar'

export default function PublicLayout() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
