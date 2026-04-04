import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Instagram, MessageCircle, Music2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import SplashScreen from '../../components/SplashScreen';
import ThreeBackground from '../../components/ThreeBackground';

interface Service {
  id: number;
  name: string;
  description: string;
  duration: number;
  price: number;
  promotional_price: number | null;
  image: string;
}

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState({ 
    profile_name: 'Letícia Studio',
    cover_photo: 'https://images.unsplash.com/photo-1587775537446-271510255146?w=1600&q=80', 
    profile_photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80',
    subtitle: 'Transformando unhas em obras de arte🖌️🎨',
    services_title: 'Nossos Serviços',
    services_subtitle: 'Selecione um serviço abaixo para ver os horários disponíveis.',
    btn_schedule: 'Agendar Horário',
    btn_account: 'Minha Conta',
    btn_service_schedule: 'Agendar este serviço',
    instagram_url: '',
    tiktok_url: ''
  });
  const [showSplash, setShowSplash] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => setServices(data));

    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setSettings(prev => ({
            profile_name: data.profile_name || prev.profile_name,
            cover_photo: data.cover_photo || prev.cover_photo,
            profile_photo: data.profile_photo || prev.profile_photo,
            subtitle: data.subtitle || prev.subtitle,
            services_title: data.services_title || prev.services_title,
            services_subtitle: data.services_subtitle || prev.services_subtitle,
            btn_schedule: data.btn_schedule || prev.btn_schedule,
            btn_account: data.btn_account || prev.btn_account,
            btn_service_schedule: data.btn_service_schedule || prev.btn_service_schedule,
            instagram_url: data.instagram_url || prev.instagram_url,
            tiktok_url: data.tiktok_url || prev.tiktok_url
          }));
        }
      });

    // Handle scroll to hash if present
    if (window.location.hash === '#servicos') {
      setTimeout(() => {
        const element = document.getElementById('servicos');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 3100); // Wait for splash screen
    }
  }, []);

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>

      <div className="min-h-screen bg-background relative">
        <ThreeBackground />
        
        {/* Hero Section */}
        <section className="relative w-full flex flex-col z-10">
          {/* Top Background Image */}
          <div className="h-56 md:h-72 w-full relative">
            <img 
              src={settings.cover_photo} 
              alt="Capa" 
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Pink Bottom Section */}
          <div className="bg-secondary pt-16 pb-12 px-4 text-center relative">
            {/* Curve SVG */}
            <svg 
              viewBox="0 0 1440 100" 
              preserveAspectRatio="none" 
              className="absolute bottom-full left-0 w-full h-12 md:h-16"
            >
              <path d="M0,100 Q720,0 1440,100 L1440,100 L0,100 Z" fill="var(--color-secondary)" />
            </svg>

            {/* Profile Picture */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 3.2, type: "spring", stiffness: 200, damping: 20 }}
              className="absolute -top-16 left-1/2 -translate-x-1/2 z-10"
            >
              <div className="w-32 h-32 md:w-36 md:h-36 rounded-full border-[6px] border-white overflow-hidden shadow-sm">
                 <img 
                   src={settings.profile_photo} 
                   alt="Perfil" 
                   className="w-full h-full object-cover"
                 />
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.4, duration: 0.6 }}
              className="relative z-10 mt-4"
            >
              <h1 className="text-3xl md:text-4xl font-medium text-accent mb-2">
                {settings.profile_name}
              </h1>
              <p className="text-xs md:text-sm font-semibold tracking-widest text-primary mb-6 uppercase">
                {settings.subtitle}
              </p>
              
              {/* Social Icons */}
              <div className="flex justify-center gap-6 text-accent mb-10">
                 {settings.instagram_url && (
                   <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors transform hover:scale-110">
                     <Instagram className="w-6 h-6" />
                   </a>
                 )}
                 {settings.tiktok_url && (
                   <a href={settings.tiktok_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors transform hover:scale-110">
                     <Music2 className="w-6 h-6" />
                   </a>
                 )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
                <a 
                  href="#servicos" 
                  className="inline-flex items-center justify-center px-8 py-4 bg-accent text-white font-medium rounded-full hover:bg-accent/90 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-accent/30 w-full sm:w-auto"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  {settings.btn_schedule}
                </a>
                <Link 
                  to="/login" 
                  className="inline-flex items-center justify-center px-8 py-4 bg-white/50 backdrop-blur-sm border border-accent/20 text-accent font-medium rounded-full hover:bg-white/70 transition-all duration-300 w-full sm:w-auto"
                >
                  {settings.btn_account}
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Services Section */}
        <section id="servicos" className="py-20 px-4 max-w-7xl mx-auto scroll-mt-10 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display text-accent mb-4">{settings.services_title}</h2>
            <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
            <p className="text-text-light mt-6">{settings.services_subtitle}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                onClick={() => navigate('/agendar', { state: { serviceId: service.id } })}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.1, duration: 0.5, type: "spring" }}
                whileHover={{ y: -10 }}
                className="group bg-surface/80 backdrop-blur-md rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-secondary cursor-pointer"
              >
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.name} 
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-4 left-0 w-full text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-4 group-hover:translate-y-0">
                    <span className="inline-block px-6 py-2 bg-white/20 backdrop-blur-md text-white rounded-full font-medium border border-white/30">
                      {settings.btn_service_schedule}
                    </span>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-display mb-2 text-accent">{service.name}</h3>
                  <p className="text-text-light mb-6 line-clamp-2">{service.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-text-light text-sm">
                      <Clock className="w-4 h-4 mr-1" />
                      {service.duration} min
                    </div>
                    <div className="text-right">
                      {service.promotional_price ? (
                        <>
                          <div className="text-xs text-text-light line-through">R$ {service.price.toFixed(2)}</div>
                          <div className="text-lg font-medium text-primary">R$ {service.promotional_price.toFixed(2)}</div>
                        </>
                      ) : (
                        <div className="text-lg font-medium text-primary">R$ {service.price.toFixed(2)}</div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
