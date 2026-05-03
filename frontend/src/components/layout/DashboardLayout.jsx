import Sidebar from './Sidebar'
import TopBar  from './TopBar'

// Layout base responsivo que envuelve todas las páginas del dashboard
const DashboardLayout = ({ children, title }) => {
  return (
    <div className="flex h-screen overflow-hidden"
         style={{ background: 'var(--bg-primary)' }}>

      {/* Sidebar — oculto en móvil, visible en desktop */}
      <Sidebar />

      {/* Área principal con topbar y contenido */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar title={title} />

        {/* Área de scroll — padding bottom para la bottom nav en móvil */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 lg:pb-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout