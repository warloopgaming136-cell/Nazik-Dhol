// Seeds the database with an admin account and starter content so the site
// is fully browsable immediately after setup. Run with: npm run seed
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('./db');

const User = require('../models/User');
const Service = require('../models/Service');
const Package = require('../models/Package');
const Team = require('../models/Team');
const Review = require('../models/Review');

const services = [
  { title: 'Wedding', slug: 'wedding', description: 'Grand dhol entry for the baraat and stage-lighting welcome for the couple.', startingPrice: 8000, duration: '2 - 3 hours', icon: 'fa-ring', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop' },
  { title: 'Reception', slug: 'reception', description: 'Elegant welcome beats to greet guests as they arrive at the reception.', startingPrice: 6000, duration: '1.5 - 2 hours', icon: 'fa-champagne-glasses', image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=800&auto=format&fit=crop' },
  { title: 'Birthday', slug: 'birthday', description: 'High-energy dhol performance to kick off birthday celebrations in style.', startingPrice: 4000, duration: '1 hour', icon: 'fa-cake-candles', image: 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?q=80&w=800&auto=format&fit=crop' },
  { title: 'Temple Festival', slug: 'temple-festival', description: 'Traditional rhythms for religious processions and temple festivities.', startingPrice: 5000, duration: '2 hours', icon: 'fa-place-of-worship', image: 'https://images.unsplash.com/photo-1561361058-c24cecae35ca?q=80&w=800&auto=format&fit=crop' },
  { title: 'House Warming', slug: 'house-warming', description: 'Auspicious beats to bless a new beginning at your Griha Pravesh.', startingPrice: 3500, duration: '1 hour', icon: 'fa-house', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=800&auto=format&fit=crop' },
  { title: 'College Function', slug: 'college-function', description: 'Youthful, energetic performances for fests, farewells and freshers.', startingPrice: 4500, duration: '1 - 1.5 hours', icon: 'fa-graduation-cap', image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=800&auto=format&fit=crop' },
  { title: 'Corporate Event', slug: 'corporate-event', description: 'Polished, professional dhol acts for product launches and galas.', startingPrice: 7000, duration: '1 - 2 hours', icon: 'fa-building', image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop' },
  { title: 'Political Event', slug: 'political-event', description: 'Powerful crowd-rousing beats for rallies and public gatherings.', startingPrice: 9000, duration: '2 - 4 hours', icon: 'fa-flag', image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?q=80&w=800&auto=format&fit=crop' },
  { title: 'School Event', slug: 'school-event', description: 'Fun, engaging performances tailored for school annual days.', startingPrice: 3000, duration: '1 hour', icon: 'fa-school', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop' },
  { title: 'Opening Ceremony', slug: 'opening-ceremony', description: 'A thunderous grand-opening entrance for stores and showrooms.', startingPrice: 5500, duration: '1 hour', icon: 'fa-scissors', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=800&auto=format&fit=crop' },
  { title: 'DJ Night', slug: 'dj-night', description: 'Dhol fused with DJ beats for an unforgettable night of dance.', startingPrice: 10000, duration: '3 hours', icon: 'fa-music', image: 'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?q=80&w=800&auto=format&fit=crop' },
  { title: 'Special Festival', slug: 'special-festival', description: 'Custom performances for Navratri, Ganesh Chaturthi, Diwali and more.', startingPrice: 6000, duration: '2 - 3 hours', icon: 'fa-star', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop' },
];

const packages = [
  { name: 'Basic Package', price: 4999, numberOfMembers: 4, duration: '1 hour', features: ['4 professional dhol players', 'Standard entry performance', 'Basic costume'], instrumentsIncluded: ['Dhol'] },
  { name: 'Standard Package', price: 8999, numberOfMembers: 6, duration: '1.5 hours', features: ['6 professional dhol players', 'Choreographed entry', 'Themed costumes', 'LED dhol option'], instrumentsIncluded: ['Dhol', 'Tasha'] },
  { name: 'Premium Package', price: 14999, numberOfMembers: 8, duration: '2 hours', features: ['8 professional dhol players', 'Custom choreography', 'Premium costumes', 'Fire/confetti effects add-on'], instrumentsIncluded: ['Dhol', 'Tasha', 'Shehnai'], isPopular: true },
  { name: 'Royal Package', price: 21999, numberOfMembers: 12, duration: '2.5 hours', features: ['12 professional dhol players', 'Royal entry with décor', 'Designer costumes', 'Dedicated event coordinator'], instrumentsIncluded: ['Dhol', 'Tasha', 'Shehnai', 'Nagada'] },
  { name: 'VIP Package', price: 34999, numberOfMembers: 16, duration: '3+ hours', features: ['16 professional dhol players', 'Multi-act performance', 'Pyro & special effects', 'Full event coordination', 'Priority date booking'], instrumentsIncluded: ['Dhol', 'Tasha', 'Shehnai', 'Nagada', 'Dhak'] },
];

const team = [
  { name: 'Aakash Rathore', role: 'Founder & Lead Dhol Player', experience: '12+ years', phone: '9999900001', displayOrder: 1, bio: 'Founder of Nazik Dhol; has performed at 500+ premium events across the country.' },
  { name: 'Vikram Solanki', role: 'Team Captain', experience: '10+ years', phone: '9999900002', displayOrder: 2 },
  { name: 'Rohit Chauhan', role: 'Senior Performer', experience: '8+ years', phone: '9999900003', displayOrder: 3 },
  { name: 'Manav Trivedi', role: 'Tasha Specialist', experience: '7+ years', phone: '9999900004', displayOrder: 4 },
  { name: 'Devansh Patel', role: 'Choreographer', experience: '9+ years', phone: '9999900005', displayOrder: 5 },
  { name: 'Kunal Mehta', role: 'Performer', experience: '5+ years', phone: '9999900006', displayOrder: 6 },
];

const reviews = [
  { customerName: 'Priya Sharma', rating: 5, comment: 'Nazik Dhol made our wedding entry absolutely unforgettable. The energy was incredible!', eventType: 'Wedding', isApproved: true },
  { customerName: 'Rahul Verma', rating: 5, comment: 'Booked them for our corporate launch — professional, punctual, and phenomenal performance.', eventType: 'Corporate Event', isApproved: true },
  { customerName: 'Sneha Iyer', rating: 4, comment: 'Great performance at our temple festival. Would definitely book again next year.', eventType: 'Temple Festival', isApproved: true },
  { customerName: 'Arjun Nair', rating: 5, comment: 'The Royal Package was worth every rupee. Our guests are still talking about it!', eventType: 'Reception', isApproved: true },
];

const run = async () => {
  await connectDB();

  console.log('Seeding database...');

  // Admin user
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@nazikdhol.com').toLowerCase();
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await User.create({
      name: process.env.ADMIN_NAME || 'Nazik Admin',
      email: adminEmail,
      phone: '9999999999',
      password: process.env.ADMIN_PASSWORD || 'Admin@12345',
      role: 'admin',
    });
    console.log(`Admin created: ${adminEmail}`);
  } else {
    console.log('Admin already exists, skipping.');
  }

  await Service.deleteMany({});
  await Service.insertMany(services);
  console.log(`${services.length} services seeded.`);

  await Package.deleteMany({});
  await Package.insertMany(packages);
  console.log(`${packages.length} packages seeded.`);

  await Team.deleteMany({});
  await Team.insertMany(team);
  console.log(`${team.length} team members seeded.`);

  await Review.deleteMany({});
  await Review.insertMany(reviews);
  console.log(`${reviews.length} reviews seeded.`);

  console.log('\nSeeding complete!');
  mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
