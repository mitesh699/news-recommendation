import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Github } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = {
    about: [
      { name: 'About Us', path: '/about' },
      { name: 'How It Works', path: '/how-it-works' },
      { name: 'Our Team', path: '/team' },
      { name: 'Careers', path: '/careers' }
    ],
    legal: [
      { name: 'Terms of Service', path: '/terms' },
      { name: 'Privacy Policy', path: '/privacy' },
      { name: 'Cookie Policy', path: '/cookies' }
    ],
    help: [
      { name: 'FAQ', path: '/faq' },
      { name: 'Contact Us', path: '/contact' },
      { name: 'Support', path: '/support' }
    ],
    social: [
      { name: 'Facebook', icon: <Facebook size={20} />, path: 'https://facebook.com' },
      { name: 'Twitter', icon: <Twitter size={20} />, path: 'https://twitter.com' },
      { name: 'Instagram', icon: <Instagram size={20} />, path: 'https://instagram.com' },
      { name: 'Github', icon: <Github size={20} />, path: 'https://github.com' }
    ]
  };

  return (
    <footer className="bg-gray-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and description */}
          <div className="col-span-1">
            <Link to="/" className="text-2xl font-bold text-white">NewsAI</Link>
            <p className="mt-4 text-gray-400 text-sm">
              Your personalized AI-powered news recommendation platform. 
              Get the latest news tailored to your interests from across the web.
            </p>
          </div>
          
          {/* About links */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">About</h3>
            <ul className="space-y-2">
              {footerLinks.about.map((link, index) => (
                <li key={index}>
                  <Link to={link.path} className="text-gray-400 hover:text-white transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Legal links */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <Link to={link.path} className="text-gray-400 hover:text-white transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
            
            <h3 className="text-lg font-semibold mt-6 mb-4">Help</h3>
            <ul className="space-y-2">
              {footerLinks.help.map((link, index) => (
                <li key={index}>
                  <Link to={link.path} className="text-gray-400 hover:text-white transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Newsletter and social */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">Stay Updated</h3>
            <p className="text-gray-400 text-sm mb-4">
              Subscribe to our newsletter for curated news digests.
            </p>
            
            <form className="mb-6">
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="px-4 py-2 w-full text-gray-800 rounded-l-md focus:outline-none"
                />
                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-r-md"
                >
                  Subscribe
                </button>
              </div>
            </form>
            
            <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              {footerLinks.social.map((link, index) => (
                <a 
                  key={index}
                  href={link.path} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label={link.name}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            &copy; {currentYear} NewsAI. All rights reserved.
          </p>
          
          <div className="mt-4 md:mt-0">
            <select 
              className="bg-gray-700 text-white text-sm py-1 px-2 rounded-md"
              defaultValue="en"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;