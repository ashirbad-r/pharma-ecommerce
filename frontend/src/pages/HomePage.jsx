import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, Clock, Star } from 'lucide-react';

const categories = [
  { name: 'Tablets & Capsules', slug: 'tablets-capsules', emoji: '💊' },
  { name: 'Syrups & Liquids', slug: 'syrups-liquids', emoji: '🧴' },
  { name: 'Vitamins & Supplements', slug: 'vitamins-supplements', emoji: '🌿' },
  { name: 'Ayurvedic', slug: 'ayurvedic', emoji: '🌱' },
  { name: 'Medical Devices', slug: 'medical-devices', emoji: '🩺' },
  { name: 'First Aid', slug: 'first-aid', emoji: '🩹' },
];

const features = [
  { icon: ShieldCheck, title: 'Genuine Medicines', desc: '100% authentic products from licensed pharmacies' },
  { icon: Truck, title: 'Fast Delivery', desc: 'Same day delivery on orders before 12 PM' },
  { icon: Clock, title: '24/7 Support', desc: 'Round the clock customer support' },
  { icon: Star, title: 'Expert Advice', desc: 'Pharmacist consultation available' },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-16">

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-3xl px-8 py-16 text-center">
        <span className="inline-block bg-green-100 text-green-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
          India's Trusted Online Pharmacy
        </span>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          Your Health, <span className="text-green-600">Delivered</span>
        </h1>
        <p className="text-gray-600 text-lg mb-8 max-w-xl mx-auto">
          Order genuine medicines, health products, and supplements from the comfort of your home.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link to="/products"
            className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-lg shadow-green-200">
            Shop Now
          </Link>
          <Link to="/register"
            className="bg-white text-green-600 px-8 py-3 rounded-xl font-semibold hover:bg-green-50 transition-colors border border-green-200">
            Sign Up Free
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Shop by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link key={cat.slug} to={`/products?category=${cat.slug}`}
              className="bg-white rounded-2xl p-5 text-center hover:shadow-md hover:border-green-200 border border-gray-100 transition-all group">
              <div className="text-4xl mb-3">{cat.emoji}</div>
              <p className="text-sm font-medium text-gray-700 group-hover:text-green-600 transition-colors">
                {cat.name}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100 flex flex-col gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Icon size={20} className="text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-gray-500 text-sm">{desc}</p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="bg-green-600 rounded-3xl px-8 py-12 text-center text-white">
        <h2 className="text-3xl font-bold mb-3">Need a Medicine?</h2>
        <p className="text-green-100 mb-6">Upload your prescription and we'll deliver it to your door.</p>
        <Link to="/products"
          className="bg-white text-green-600 px-8 py-3 rounded-xl font-semibold hover:bg-green-50 transition-colors inline-block">
          Browse Medicines
        </Link>
      </section>

    </div>
  );
}
