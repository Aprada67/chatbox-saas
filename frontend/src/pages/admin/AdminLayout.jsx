import DashboardLayout from "../../components/layout/DashboardLayout"

// Layout reutilizable para todas las páginas del admin
const AdminLayout = ({ children, title }) => {
  return (
    <DashboardLayout title={title}>
      {children}
    </DashboardLayout>
  )
}

export default AdminLayout