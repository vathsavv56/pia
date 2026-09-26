import Client from '@/components/Client'
import MainContainer from '@/MainContainer'
import { createBrowserRouter, RouterProvider } from 'react-router'

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
        path: '/req/:id',
        element: <div>THis is /req/:id</div>,
      },
    ],
  },
])

const App = () => {
  return <RouterProvider router={router}></RouterProvider>
}

export default App
