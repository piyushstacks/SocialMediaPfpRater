

// components/layout/Footer.tsx
export default function Footer() {
  return (
    <footer className="mb-10 px-4 text-center text-gray-500">
      {/* <small className="mb-2 block text-xs">
        &copy; 2024 Image Rater. All rights reserved.
      </small> */}
      <p className="text-xs">
        <span className="font-semibold">built by</span> <a className="underline cursor-pointer" href="">Piyush Bhagchandani</a>
      </p>
    </footer>
  )
}