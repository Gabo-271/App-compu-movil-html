import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Vote, CheckCircle2, Users, TrendingUp, Sparkles, ArrowRight, BarChart3, Shield, Zap, Heart, ChevronDown } from 'lucide-react';
import { useVoteApp } from './VoteAppContext';
import { Button } from './ui/button';
import { Card } from './ui/card';

export function HomePage() {
  const { navigateTo, state } = useVoteApp();
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

  const features = [
    {
      icon: Vote,
      title: 'Votaciones Democráticas',
      description: 'Participa en decisiones importantes de tu comunidad',
      color: 'from-indigo-500 to-purple-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      iconColor: 'text-indigo-600 dark:text-indigo-400'
    },
    {
      icon: BarChart3,
      title: 'Resultados en Tiempo Real',
      description: 'Observa los resultados actualizados al instante',
      color: 'from-teal-500 to-emerald-600',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20',
      iconColor: 'text-teal-600 dark:text-teal-400'
    },
    {
      icon: Shield,
      title: 'Seguro y Transparente',
      description: 'Tu voto es privado y verificable',
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      iconColor: 'text-orange-600 dark:text-orange-400'
    },
    {
      icon: Users,
      title: 'Comunidad Activa',
      description: 'Miles de ciudadanos participando',
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400'
    }
  ];

  const stats = [
    { label: 'Votaciones Activas', value: '12+', icon: TrendingUp, color: 'text-indigo-600 dark:text-indigo-400' },
    { label: 'Usuarios Registrados', value: '5,000+', icon: Users, color: 'text-teal-600 dark:text-teal-400' },
    { label: 'Votos Emitidos', value: '15,000+', icon: CheckCircle2, color: 'text-orange-600 dark:text-orange-400' },
    { label: 'Satisfacción', value: '98%', icon: Heart, color: 'text-purple-600 dark:text-purple-400' }
  ];

  const handleScroll = () => {
    if (window.scrollY > 100) {
      setShowScrollIndicator(false);
    }
  };

  React.useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 overflow-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full mix-blend-multiply filter blur-xl opacity-20 dark:opacity-10"
              style={{
                background: `linear-gradient(45deg, ${
                  ['#1E88E5', '#43A047', '#7c3aed', '#0f766e', '#ea580c', '#4f46e5'][i % 6]
                }, transparent)`,
                width: Math.random() * 300 + 100,
                height: Math.random() * 300 + 100,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                x: [0, Math.random() * 100 - 50],
                y: [0, Math.random() * 100 - 50],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
            />
          ))}
        </div>

        {/* Main Content */}
        <motion.div
          className="relative z-10 text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Logo Icon */}
          <motion.div
            className="flex justify-center mb-8"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: 'spring', bounce: 0.5 }}
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur-2xl opacity-50"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.7, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                }}
              />
              <div className="relative bg-gradient-to-br from-indigo-600 to-purple-600 p-6 rounded-3xl shadow-2xl">
                <Vote className="size-16 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Title with Gradient */}
          <motion.h1
            className="text-6xl sm:text-7xl lg:text-8xl mb-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            VoteApp
          </motion.h1>

          {/* Subtitle */}
          <motion.div
            className="flex items-center justify-center gap-2 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <Sparkles className="size-5 text-yellow-500" />
            <p className="text-xl sm:text-2xl text-slate-700 dark:text-slate-300">
              La plataforma moderna de votaciones ciudadanas
            </p>
            <Sparkles className="size-5 text-yellow-500" />
          </motion.div>

          <motion.p
            className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            Participa en las decisiones que importan. Vota de manera segura, transparente y accesible
            desde cualquier lugar. Tu voz cuenta.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xl px-8 py-6 gap-2 group"
                onClick={() => navigateTo('voting-list')}
              >
                <Zap className="size-5" />
                Ver Votaciones Activas
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="size-5" />
                </motion.div>
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 px-8 py-6 gap-2"
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Sparkles className="size-5" />
                Descubre Más
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <Card className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-2 border-transparent hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300">
                  <stat.icon className={`size-8 ${stat.color} mb-2 mx-auto`} />
                  <div className="text-2xl sm:text-3xl text-slate-900 dark:text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {stat.label}
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <AnimatePresence>
          {showScrollIndicator && (
            <motion.div
              className="absolute bottom-8 left-1/2 -translate-x-1/2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 1.5 }}
            >
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400"
              >
                <span className="text-sm">Desliza para explorar</span>
                <ChevronDown className="size-6" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Features Section */}
      <div id="features" className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl sm:text-5xl text-slate-900 dark:text-white mb-4">
              ¿Por qué elegir VoteApp?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Una plataforma diseñada para empoderar a la ciudadanía con tecnología moderna
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <Card className={`p-6 h-full border-2 transition-all duration-500 ${
                  hoveredFeature === index
                    ? 'border-transparent shadow-2xl scale-105'
                    : 'border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="relative">
                    {/* Gradient Background on Hover */}
                    <AnimatePresence>
                      {hoveredFeature === index && (
                        <motion.div
                          className={`absolute inset-0 bg-gradient-to-br ${feature.color} rounded-lg -z-10`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 0.1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </AnimatePresence>

                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <motion.div
                        className={`${feature.bgColor} p-4 rounded-2xl flex-shrink-0`}
                        animate={hoveredFeature === index ? {
                          rotate: [0, -10, 10, -10, 0],
                          scale: [1, 1.1, 1]
                        } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        <feature.icon className={`size-8 ${feature.iconColor}`} />
                      </motion.div>

                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="text-xl text-slate-900 dark:text-white mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-24 px-4 sm:px-6 lg:px-8">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Card className="p-12 bg-gradient-to-br from-indigo-600 via-purple-600 to-teal-600 border-0 shadow-2xl overflow-hidden relative">
            {/* Animated Gradient Overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
            />

            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
              >
                <CheckCircle2 className="size-16 text-white mx-auto mb-6" />
              </motion.div>

              <h2 className="text-3xl sm:text-4xl text-white mb-4">
                ¿Listo para hacer oír tu voz?
              </h2>
              <p className="text-xl text-indigo-100 mb-8">
                Únete a miles de ciudadanos que ya están participando en las decisiones de su comunidad
              </p>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-xl px-10 py-6 gap-2"
                  onClick={() => navigateTo('voting-list')}
                >
                  Comenzar Ahora
                  <ArrowRight className="size-5" />
                </Button>
              </motion.div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-4">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 2, type: 'spring', bounce: 0.5 }}
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              y: {
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }}
          >
            <Button
              size="lg"
              className="rounded-full size-16 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-2xl p-0"
              onClick={() => navigateTo('voting-list')}
            >
              <Vote className="size-7 text-white" />
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 2.2, type: 'spring', bounce: 0.5 }}
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              size="lg"
              className="rounded-full size-16 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-2xl p-0"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <TrendingUp className="size-7 text-white" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
