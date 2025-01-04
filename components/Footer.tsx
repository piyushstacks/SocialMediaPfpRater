

// components/layout/Footer.tsx
export default function Footer() {
  return (
    <footer className="mb-10 px-4 text-center text-gray-500">
      {/* <small className="mb-2 block text-xs">
        &copy; 2024 XIG PFP Rater - All Rights Reserved
      </small> */}
      <p className="text-xs">
        <span className="font-bold">built by</span> <a 
  className="underline cursor-pointer" 
  href="https://piyushbhagchandani.me" 
  target="_blank" 
  rel="noopener noreferrer"
>
  Piyush Bhagchandani
</a>
      </p>
    </footer>
  )
}