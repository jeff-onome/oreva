import React from 'react';
import { Sparkles, Target, Users, Heart, Linkedin, Twitter } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';

const teamMembers = [
  {
    name: 'Jasmine Lee',
    role: 'Founder & CEO',
    imageUrl: 'https://picsum.photos/seed/team1/400/400',
    bio: 'Jasmine started ORESKY with a passion for vibrant design and quality products. She leads the team with a creative vision and a customer-first mindset.',
    social: {
      linkedin: '#',
      twitter: '#',
    },
  },
  {
    name: 'Ben Carter',
    role: 'Head of Product',
    imageUrl: 'https://picsum.photos/seed/team2/400/400',
    bio: 'Ben is the mastermind behind our curated collection, always on the lookout for unique items that spark joy and inspire creativity.',
    social: {
      linkedin: '#',
      twitter: '#',
    },
  },
  {
    name: 'Chloe Garcia',
    role: 'Lead Designer',
    imageUrl: 'https://picsum.photos/seed/team3/400/400',
    bio: 'Chloe brings the ORESKY brand to life with her bold and colorful designs, ensuring our site is as delightful as our products.',
    social: {
      linkedin: '#',
      twitter: '#',
    },
  },
];

const AboutPage: React.FC = () => {
    const { settings, loading } = useSiteSettings();
    const content = settings.about_page;
    
    if (loading) {
        return <div className="text-center py-20">Loading...</div>;
    }

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-secondary to-primary text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <Sparkles size={48} className="mx-auto mb-4" />
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4">{content?.title || 'About ORESKY'}</h1>
          <p className="max-w-3xl mx-auto text-base md:text-lg text-indigo-100">
            {content?.subtitle || "We believe in a world filled with color, creativity, and connection. ORESKY is more than just a store; it's a celebration of unique style and personal expression."}
          </p>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
              <Target size={32} className="text-primary mb-2 inline-block" />
              <h2 className="text-2xl md:text-3xl font-bold mb-4">{content?.missionTitle || 'Our Mission'}</h2>
              <p className="text-text-secondary text-lg leading-relaxed">
                {content?.missionContent || "Our mission is to curate a vibrant collection of high-quality products that inspire creativity and bring joy to everyday life. We carefully select items from talented artisans and innovative brands, ensuring every piece tells a story and adds a splash of color to your world. We're committed to ethical sourcing, great design, and exceptional customer service."}
              </p>
            </div>
            <div>
              <img src="https://picsum.photos/seed/about/800/600" alt="Crafting process" className="rounded-xl shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="bg-neutral py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6 bg-base rounded-xl shadow-lg">
              <Sparkles size={40} className="mx-auto text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Creativity First</h3>
              <p className="text-text-secondary">We celebrate originality and artistry in everything we do, from our products to our platform.</p>
            </div>
            <div className="p-6 bg-base rounded-xl shadow-lg">
              <Heart size={40} className="mx-auto text-secondary mb-4" />
              <h3 className="text-xl font-bold mb-2">Customer Joy</h3>
              <p className="text-text-secondary">Your happiness is our priority. We strive to provide a delightful and seamless shopping experience.</p>
            </div>
            <div className="p-6 bg-base rounded-xl shadow-lg">
              <Users size={40} className="mx-auto text-accent mb-4" />
              <h3 className="text-xl font-bold mb-2">Community Focused</h3>
              <p className="text-text-secondary">We believe in building a vibrant community of creators, customers, and partners.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Team Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Meet the Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map(member => (
              <div key={member.name} className="bg-base rounded-xl shadow-lg text-center p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                <img src={member.imageUrl} alt={member.name} className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-primary" />
                <h3 className="text-xl font-bold">{member.name}</h3>
                <p className="text-primary font-semibold mb-2">{member.role}</p>
                <p className="text-text-secondary text-sm mb-4">{member.bio}</p>
                <div className="flex justify-center space-x-4">
                  <a href={member.social.linkedin} className="text-text-secondary hover:text-primary"><Linkedin /></a>
                  <a href={member.social.twitter} className="text-text-secondary hover:text-primary"><Twitter /></a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
