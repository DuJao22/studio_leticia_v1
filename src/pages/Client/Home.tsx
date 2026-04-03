import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Calendar, Clock, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

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
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => setServices(data));

    // Handle scroll to hash if present
    if (window.location.hash === '#servicos') {
      setTimeout(() => {
        const element = document.getElementById('servicos');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1600&q=80" 
            alt="Spa background" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Sparkles className="w-12 h-12 text-accent mx-auto mb-6" />
            <h1 className="text-5xl md:text-7xl font-display font-light text-text-main mb-6 tracking-tight">
              Letícia Studio
            </h1>
            <p className="text-lg md:text-xl text-text-light mb-10 font-light">
              Sua jornada de beleza e bem-estar começa aqui. Experiências premium para mulheres sofisticadas.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="#servicos" 
                className="inline-flex items-center justify-center px-8 py-4 bg-primary text-text-main font-medium rounded-full hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-primary/30 w-full sm:w-auto"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Agendar Horário
              </a>
              <Link 
                to="/login" 
                className="inline-flex items-center justify-center px-8 py-4 bg-surface/50 backdrop-blur-sm border border-secondary text-text-main font-medium rounded-full hover:bg-surface transition-all duration-300 w-full sm:w-auto"
              >
                Minha Conta
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicos" className="py-20 px-4 max-w-7xl mx-auto scroll-mt-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display text-text-main mb-4">Nossos Serviços</h2>
          <div className="w-24 h-1 bg-accent mx-auto rounded-full"></div>
          <p className="text-text-light mt-6">Selecione um serviço abaixo para ver os horários disponíveis.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              onClick={() => navigate('/agendar', { state: { serviceId: service.id } })}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group bg-surface rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-secondary cursor-pointer"
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
                    Agendar este serviço
                  </span>
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-display mb-2">{service.name}</h3>
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
                        <div className="text-lg font-medium text-accent">R$ {service.promotional_price.toFixed(2)}</div>
                      </>
                    ) : (
                      <div className="text-lg font-medium text-accent">R$ {service.price.toFixed(2)}</div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
