import Client from '@/components/Client'
import MainContainer from '@/MainContainer'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainContainer />,
    children: [
      {
        index: true,
        element: <Client />,
      },
      {
        path: 'req/:id',
        element: <Client />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate replace to="/" />,
  },
])

const App = () => {
  return <RouterProvider router={router}></RouterProvider>
}

export default App
