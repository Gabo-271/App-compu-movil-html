import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Vote, 
  ChevronRight, 
  Users, 
  TrendingUp, 
  Shield, 
  Zap, 
  BarChart3,
  Globe,
  Clock,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Target,
  Award,
  Lock,
  Eye
} from 'lucide-react';
import { useVoteApp } from './VoteAppContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

export function HomePageNew() {
  const { navigateTo } = useVoteApp();
  const [activeTab, setActiveTab] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const heroFeatures = [
    { icon: Shield, text: 'Seguro', color: 'text-indigo-600' },
    { icon: Zap, text: 'Rápido', color: 'text-teal-600' },
    { icon: Globe, text: 'Accesible', color: 'text-purple-600' },
    { icon: Lock, text: 'Privado', color: 'text-orange-600' }
  ];

  const benefits = [
    {
      title: 'Democracia Digital',
      description: 'Ejercé tu derecho a voto desde cualquier lugar, en cualquier momento.',
      icon: Vote,
      gradient: 'from-indigo-500 to-blue-600',
      stats: '98% participación',
      image: '🗳️'
    },
    {
      title: 'Transparencia Total',
      description: 'Seguí en tiempo real los resultados y estadísticas de cada votación.',
      icon: Eye,
      gradient: 'from-teal-500 to-emerald-600',
      stats: '100% trazabilidad',
      image: '📊'
    },
    {
      title: 'Seguridad Garantizada',
      description: 'Tu identidad y voto están protegidos con encriptación de nivel bancario.',
      icon: Shield,
      gradient: 'from-purple-500 to-pink-600',
      stats: 'Certificación SSL',
      image: '🔒'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Registrate',
      description: 'Creá tu cuenta en segundos con Google',
      icon: Users,
      color: 'bg-indigo-500'
    },
    {
      number: '02',
      title: 'Explorá',
      description: 'Descubrí votaciones activas en tu comunidad',
      icon: Target,
      color: 'bg-teal-500'
    },
    {
      number: '03',
      title: 'Votá',
      description: 'Emití tu voto de forma segura y anónima',
      icon: Vote,
      color: 'bg-purple-500'
    },
    {
      number: '04',
      title: 'Impactá',
      description: 'Observá el impacto de tu participación',
      icon: Award,
      color: 'bg-orange-500'
    }
  ];

  const liveVotes = [
    { title: 'Presupuesto Municipal 2024', votes: 1247, trend: '+23', category: 'Gobierno' },
    { title: 'Nuevo Parque Recreativo', votes: 892, trend: '+18', category: 'Desarrollo' },
    { title: 'Sistema de Educación Digital', votes: 734, trend: '+31', category: 'Educación' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, type: 'spring' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-xl">
                <Vote className="size-6 text-white" />
              </div>
              <span className="text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                VoteApp
              </span>
            </motion.div>

            <div className="flex items-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="ghost"
                  onClick={() => navigateTo('login')}
                >
                  Iniciar Sesión
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  onClick={() => navigateTo('voting-list')}
                >
                  Ver Votaciones
                  <ChevronRight className="size-4 ml-1" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section - Modern Split Design */}
      <div className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Badge className="mb-6 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700">
                  <Sparkles className="size-3 mr-1" />
                  Plataforma de Votación Digital
                </Badge>
              </motion.div>

              <motion.h1 
                className="text-5xl sm:text-6xl lg:text-7xl mb-6 text-slate-900 dark:text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Tu voz,{' '}
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
                  tu poder
                </span>
              </motion.h1>

              <motion.p 
                className="text-xl text-slate-600 dark:text-slate-400 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Participá en las decisiones que transforman tu comunidad. 
                Votá de manera segura, transparente y desde cualquier lugar.
              </motion.p>

              <motion.div
                className="flex flex-wrap gap-4 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl px-8"
                    onClick={() => navigateTo('voting-list')}
                  >
                    <Zap className="size-5 mr-2" />
                    Comenzar Ahora
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-2"
                    onClick={() => {
                      document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Cómo Funciona
                    <ArrowRight className="size-5 ml-2" />
                  </Button>
                </motion.div>
              </motion.div>

              <motion.div
                className="flex flex-wrap gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {heroFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.text}
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                  >
                    <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                      <feature.icon className={`size-5 ${feature.color}`} />
                    </div>
                    <span className="text-slate-700 dark:text-slate-300">{feature.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Content - Interactive Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <Card className="p-8 bg-white dark:bg-slate-800 shadow-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Live Indicator */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="size-3 bg-green-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Votaciones en Vivo</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    <TrendingUp className="size-3 mr-1" />
                    En tiempo real
                  </Badge>
                </div>

                {/* Live Votes List */}
                <div className="space-y-4">
                  {liveVotes.map((vote, index) => (
                    <motion.div
                      key={vote.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 border border-slate-200 dark:border-slate-600 cursor-pointer"
                      onClick={() => navigateTo('voting-list')}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-slate-900 dark:text-white mb-1">{vote.title}</p>
                          <Badge variant="outline" className="text-xs">
                            {vote.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Users className="size-4" />
                          <span>{vote.votes} votos</span>
                        </div>
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
                          <TrendingUp className="size-4" />
                          <span>{vote.trend}%</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* View All Button */}
                <motion.div
                  className="mt-6"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    onClick={() => navigateTo('voting-list')}
                  >
                    Ver Todas las Votaciones
                    <ChevronRight className="size-4 ml-2" />
                  </Button>
                </motion.div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Benefits Section - Cards with Tabs */}
      <div className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl text-slate-900 dark:text-white mb-4">
              ¿Por qué VoteApp?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              La forma más moderna y segura de participar en tu democracia
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ y: -10 }}
              >
                <Card className="p-8 h-full border-2 hover:border-transparent hover:shadow-2xl transition-all duration-300 relative overflow-hidden group">
                  {/* Gradient Overlay on Hover */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${benefit.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10`}
                  />

                  {/* Large Emoji Background */}
                  <div className="text-6xl mb-4 opacity-20 absolute top-4 right-4">
                    {benefit.image}
                  </div>

                  <div className="relative z-10">
                    <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${benefit.gradient} mb-4`}>
                      <benefit.icon className="size-8 text-white" />
                    </div>

                    <h3 className="text-2xl text-slate-900 dark:text-white mb-3">
                      {benefit.title}
                    </h3>

                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      {benefit.description}
                    </p>

                    <Badge className={`bg-gradient-to-r ${benefit.gradient} text-white border-0`}>
                      <CheckCircle className="size-3 mr-1" />
                      {benefit.stats}
                    </Badge>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl text-slate-900 dark:text-white mb-4">
              Comenzá en 4 simples pasos
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Es fácil, rápido y completamente seguro
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative"
              >
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-20 left-full w-full h-0.5 bg-gradient-to-r from-slate-300 to-transparent dark:from-slate-700 -z-10" />
                )}

                <Card className="p-6 text-center h-full hover:shadow-xl transition-all duration-300 border-2 hover:border-indigo-300 dark:hover:border-indigo-700">
                  {/* Number Badge */}
                  <motion.div
                    className={`inline-flex items-center justify-center size-16 ${step.color} rounded-2xl text-white text-2xl mb-4 mx-auto`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    {step.number}
                  </motion.div>

                  {/* Icon */}
                  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl inline-flex mb-4">
                    <step.icon className="size-6 text-slate-700 dark:text-slate-300" />
                  </div>

                  <h3 className="text-xl text-slate-900 dark:text-white mb-2">
                    {step.title}
                  </h3>

                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {step.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-teal-600 relative overflow-hidden">
        {/* Animated Background Pattern */}
        <motion.div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
          animate={{
            backgroundPosition: ['0px 0px', '50px 50px']
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear'
          }}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '12+', label: 'Votaciones Activas', icon: Vote },
              { value: '5,000+', label: 'Usuarios', icon: Users },
              { value: '15,000+', label: 'Votos Emitidos', icon: CheckCircle },
              { value: '98%', label: 'Satisfacción', icon: Award }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center text-white"
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, type: 'spring' }}
              >
                <stat.icon className="size-8 mx-auto mb-3 opacity-80" />
                <div className="text-4xl sm:text-5xl mb-2">{stat.value}</div>
                <div className="text-indigo-100">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex p-4 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl mb-6">
              <Vote className="size-12 text-white" />
            </div>

            <h2 className="text-4xl sm:text-5xl text-slate-900 dark:text-white mb-6">
              ¿Listo para hacer la diferencia?
            </h2>

            <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
              Sumate a miles de ciudadanos que ya están participando activamente 
              en las decisiones de su comunidad
            </p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              whileHover={{ scale: 1.02 }}
            >
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl px-10 py-6"
                onClick={() => navigateTo('voting-list')}
              >
                <Zap className="size-5 mr-2" />
                Empezar Ahora - Es Gratis
              </Button>
            </motion.div>

            <p className="text-sm text-slate-500 dark:text-slate-500 mt-6">
              No se requiere tarjeta de crédito • Configuración en 2 minutos • 100% Seguro
            </p>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-xl">
              <Vote className="size-5 text-white" />
            </div>
            <span className="text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              VoteApp
            </span>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            © 2024 VoteApp. Transformando la democracia digital.
          </p>
        </div>
      </footer>
    </div>
  );
}
