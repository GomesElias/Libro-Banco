import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Filter, Download, CalendarDays, DollarSign, FileText, Clock, Banknote, Wallet, CreditCard, TrendingUp, TrendingDown, Landmark, Bank, Smartphone, Scale, BarChart, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

const App = () => {
  const [transactions, setTransactions] = useState(() => {
    const savedTransactions = localStorage.getItem('transactions');
    return savedTransactions ? JSON.parse(savedTransactions) : [];
  });
  const [initialBalance, setInitialBalance] = useState(() => {
    const savedBalance = localStorage.getItem('initialBalance');
    // Si no hay saldo guardado, inicializa en 0
    return savedBalance ? parseFloat(savedBalance) : 0; 
  });

  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [amountUSD, setAmountUSD] = useState('');
  const [amountBS, setAmountBS] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [transactionType, setTransactionType] = useState('Credito'); // Credito o Debito
  const [paymentChannel, setPaymentChannel] = useState('Zelle'); // Canal de pago
  const [bank, setBank] = useState(''); // Banco para Pago Móvil/Transferencia
  const [manualTime, setManualTime] = useState(''); // Hora manual

  const [filterType, setFilterType] = useState('all');
  const [filterDescription, setFilterDescription] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterBank, setFilterBank] = useState('all');

  const [showFilters, setShowFilters] = useState(false);
  const [showInitialBalanceInput, setShowInitialBalanceInput] = useState(false);

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('initialBalance', initialBalance.toString());
  }, [initialBalance]);

  const transactionCategories = [
    { value: 'Credito', label: 'Crédito', icon: TrendingUp, color: 'text-green-500' },
    { value: 'Debito', label: 'Débito', icon: TrendingDown, color: 'text-red-500' },
  ];

  const paymentChannels = [
    { value: 'Zelle', label: 'Zelle', icon: Banknote, color: 'text-blue-500' },
    { value: 'Binance', label: 'Binance', icon: Landmark, color: 'text-yellow-500' },
    { value: 'Apolo Pay', label: 'Apolo Pay', icon: CreditCard, color: 'text-purple-500' },
    { value: 'Bofa', label: 'BofA', icon: Bank, color: 'text-red-500' },
    { value: 'Pago Móvil', label: 'Pago Móvil', icon: Smartphone, color: 'text-green-500' },
    { value: 'Transferencia', label: 'Transferencia', icon: Banknote, color: 'text-indigo-500' },
    { value: 'Solfin', label: 'Solfin', icon: DollarSign, color: 'text-orange-500' }, // Nuevo canal
  ];

  const banks = [
    { value: 'BDV', label: 'BDV' },
    { value: 'Banesco', label: 'Banesco' },
    // Puedes añadir más bancos aquí
  ];

  const getIconForCategory = (categoryValue) => {
    const foundCategory = transactionCategories.find(t => t.value === categoryValue);
    return foundCategory ? foundCategory.icon : CreditCard;
  };

  const getColorForCategory = (categoryValue) => {
    const foundCategory = transactionCategories.find(t => t.value === categoryValue);
    return foundCategory ? foundCategory.color : 'text-gray-500';
  };

  const getIconForChannel = (channelValue) => {
    const foundChannel = paymentChannels.find(c => c.value === channelValue);
    return foundChannel ? foundChannel.icon : Banknote;
  };

  const handleAddTransaction = (e) => {
    e.preventDefault();
    let finalAmountUSD = 0;

    if (paymentChannel === 'Pago Móvil' || paymentChannel === 'Transferencia') {
      if (!date || !description || !amountBS || !exchangeRate || !transactionType || !bank) {
        alert('Por favor, completa todos los campos de la transacción (incluyendo monto en BS, tasa y banco).');
        return;
      }
      finalAmountUSD = parseFloat(amountBS) / parseFloat(exchangeRate);
    } else {
      if (!date || !description || !amountUSD || !transactionType) {
        alert('Por favor, completa todos los campos de la transacción en USD.');
        return;
      }
      finalAmountUSD = parseFloat(amountUSD);
    }

    const newTransaction = {
      id: Date.now(),
      date: date,
      time: manualTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), // Hora manual o automática
      description,
      amountUSD: finalAmountUSD,
      amountBS: (paymentChannel === 'Pago Móvil' || paymentChannel === 'Transferencia') ? parseFloat(amountBS) : null,
      exchangeRate: (paymentChannel === 'Pago Móvil' || paymentChannel === 'Transferencia') ? parseFloat(exchangeRate) : null,
      transactionType,
      paymentChannel,
      bank: (paymentChannel === 'Pago Móvil' || paymentChannel === 'Transferencia') ? bank : null,
    };

    setTransactions([...transactions, newTransaction]);
    setDate('');
    setDescription('');
    setAmountUSD('');
    setAmountBS('');
    setExchangeRate('');
    setTransactionType('Credito');
    setPaymentChannel('Zelle');
    setBank('');
    setManualTime(''); // Limpiar hora manual
  };

  const handleDeleteTransaction = (idToDelete) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta transacción? Esta acción no se puede deshacer.')) {
      setTransactions(prevTransactions => prevTransactions.filter(t => t.id !== idToDelete));
    }
  };

  const calculateCurrentBalance = () => {
    let balance = initialBalance;
    transactions.forEach(t => {
      if (t.transactionType === 'Credito') {
        balance += t.amountUSD;
      } else {
        balance -= t.amountUSD;
      }
    });
    return balance;
  };

  const getFilteredTransactions = () => {
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const start = filterStartDate ? new Date(filterStartDate) : null;
      const end = filterEndDate ? new Date(filterEndDate) : null;

      return (filterType === 'all' || t.transactionType === filterType) &&
             (filterDescription === '' || t.description.toLowerCase().includes(filterDescription.toLowerCase())) &&
             (!start || transactionDate >= start) &&
             (!end || transactionDate <= end) &&
             (filterChannel === 'all' || t.paymentChannel === filterChannel) &&
             (filterBank === 'all' || t.bank === filterBank);
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const downloadExcel = () => {
    const filteredTrans = getFilteredTransactions();
    if (filteredTrans.length === 0) {
      alert('No hay transacciones para generar el reporte en el período seleccionado.');
      return;
    }

    let currentReportBalance = initialBalance;
    const reportData = filteredTrans.map(t => {
      if (t.transactionType === 'Credito') {
        currentReportBalance += t.amountUSD;
      } else {
        currentReportBalance -= t.amountUSD;
      }
      return {
        Fecha: t.date,
        Hora: t.time,
        'Concepto/Descripción': t.description,
        'Monto USD': t.amountUSD.toFixed(2),
        'Monto BS': t.amountBS ? t.amountBS.toFixed(2) : 'N/A',
        'Tasa de Cambio': t.exchangeRate ? t.exchangeRate.toFixed(2) : 'N/A',
        'Tipo de Transacción': t.transactionType,
        'Canal de Pago': t.paymentChannel,
        'Banco': t.bank || 'N/A',
        'Saldo Acumulado USD': currentReportBalance.toFixed(2),
      };
    });

    const initialBalanceRow = {
      Fecha: '',
      Hora: '',
      'Concepto/Descripción': 'Saldo Inicial del Período',
      'Monto USD': '',
      'Monto BS': '',
      'Tasa de Cambio': '',
      'Tipo de Transacción': '',
      'Canal de Pago': '',
      'Banco': '',
      'Saldo Acumulado USD': initialBalance.toFixed(2),
    };

    const finalReportData = [initialBalanceRow, ...reportData];

    const ws = XLSX.utils.json_to_sheet(finalReportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Libro Banco');
    XLSX.writeFile(wb, 'Libro_Banco.xlsx');
  };

  const filteredTransactions = getFilteredTransactions();
  const currentBalance = calculateCurrentBalance();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="container mx-auto max-w-6xl bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8">
        <motion.h1
          className="text-4xl font-extrabold text-center mb-10 bg-gradient-to-r from-gray-800 to-gray-500 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Tu Gestor de Finanzas Personal
        </motion.h1>

        {/* Saldo Actual */}
        <motion.div
          className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-6 rounded-2xl shadow-lg mb-8 flex items-center justify-between"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center gap-4">
            <Wallet className="w-10 h-10" />
            <div>
              <p className="text-lg font-medium">Saldo Actual:</p>
              <p className="text-4xl font-bold">${currentBalance.toFixed(2)}</p>
            </div>
          </div>
          <motion.button
            onClick={() => setShowInitialBalanceInput(!showInitialBalanceInput)}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-5 py-2 rounded-xl font-semibold transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {showInitialBalanceInput ? 'Ocultar Saldo Inicial' : 'Editar Saldo Inicial'}
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {showInitialBalanceInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-8"
            >
              <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl shadow-inner flex items-center gap-4">
                <DollarSign className="w-6 h-6 text-blue-600" />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Establecer Saldo Inicial"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
                  className="flex-1 p-3 rounded-xl border border-blue-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-800"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Formulario de Registro de Transacciones */}
        <motion.div
          className="bg-gray-50 border border-gray-200 p-8 rounded-2xl shadow-lg mb-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <Plus className="w-6 h-6 text-blue-600" />
            Registrar Nueva Transacción
          </h2>
          <form onSubmit={handleAddTransaction} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label htmlFor="date" className="block text-gray-700 font-medium mb-2">
                <CalendarDays className="inline-block w-4 h-4 mr-2 text-gray-500" />
                Fecha
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-800"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
                <FileText className="inline-block w-4 h-4 mr-2 text-gray-500" />
                Concepto/Descripción
              </label>
              <input
                type="text"
                id="description"
                placeholder="Ej. Compra de víveres"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-800"
                required
              />
            </div>
            <div>
              <label htmlFor="manualTime" className="block text-gray-700 font-medium mb-2">
                <Clock className="inline-block w-4 h-4 mr-2 text-gray-500" />
                Hora (Opcional)
              </label>
              <input
                type="time"
                id="manualTime"
                value={manualTime}
                onChange={(e) => setManualTime(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-800"
              />
            </div>

            {/* Tipo de Transacción (Crédito/Débito) */}
            <div className="lg:col-span-1">
              <label htmlFor="transactionType" className="block text-gray-700 font-medium mb-2">
                <CreditCard className="inline-block w-4 h-4 mr-2 text-gray-500" />
                Tipo de Transacción
              </label>
              <div className="flex gap-3">
                {transactionCategories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <motion.button
                      key={cat.value}
                      type="button"
                      onClick={() => setTransactionType(cat.value)}
                      className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-semibold transition-all duration-200 ${
                        transactionType === cat.value
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Icon className={`w-5 h-5 ${transactionType === cat.value ? 'text-white' : cat.color}`} />
                      {cat.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Canal de Pago */}
            <div className="lg:col-span-1">
              <label htmlFor="paymentChannel" className="block text-gray-700 font-medium mb-2">
                <Banknote className="inline-block w-4 h-4 mr-2 text-gray-500" />
                Canal de Pago
              </label>
              <select
                id="paymentChannel"
                value={paymentChannel}
                onChange={(e) => {
                  setPaymentChannel(e.target.value);
                  if (e.target.value !== 'Pago Móvil' && e.target.value !== 'Transferencia') {
                    setBank(''); // Limpiar banco si no es PM/Transferencia
                    setAmountBS(''); // Limpiar monto BS
                    setExchangeRate(''); // Limpiar tasa
                  }
                }}
                className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-800"
              >
                {paymentChannels.map((channel) => (
                  <option key={channel.value} value={channel.value}>{channel.label}</option>
                ))}
              </select>
            </div>

            {/* Monto USD o Monto BS + Tasa + Banco */}
            {(paymentChannel !== 'Pago Móvil' && paymentChannel !== 'Transferencia') ? (
              <div>
                <label htmlFor="amountUSD" className="block text-gray-700 font-medium mb-2">
                  <DollarSign className="inline-block w-4 h-4 mr-2 text-gray-500" />
                  Monto (USD)
                </label>
                <input
                  type="number"
                  id="amountUSD"
                  step="0.01"
                  placeholder="Ej. 50.00"
                  value={amountUSD}
                  onChange={(e) => setAmountUSD(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-800"
                  required
                />
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor="amountBS" className="block text-gray-700 font-medium mb-2">
                    <Smartphone className="inline-block w-4 h-4 mr-2 text-gray-500" />
                    Monto (BS)
                  </label>
                  <input
                    type="number"
                    id="amountBS"
                    step="0.01"
                    placeholder="Ej. 500000.00"
                    value={amountBS}
                    onChange={(e) => setAmountBS(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-800"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="exchangeRate" className="block text-gray-700 font-medium mb-2">
                    <Scale className="inline-block w-4 h-4 mr-2 text-gray-500" />
                    Tasa de Cambio (BS/USD)
                  </label>
                  <input
                    type="number"
                    id="exchangeRate"
                    step="0.0001"
                    placeholder="Ej. 36.50"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-800"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="bank" className="block text-gray-700 font-medium mb-2">
                    <Bank className="inline-block w-4 h-4 mr-2 text-gray-500" />
                    Banco
                  </label>
                  <select
                    id="bank"
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-800"
                    required
                  >
                    <option value="">Selecciona un banco</option>
                    {banks.map((b) => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="md:col-span-2 lg:col-span-3 flex justify-end">
              <motion.button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-5 h-5" />
                Agregar Transacción
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* Controles de Filtrado y Reporte */}
        <motion.div
          className="bg-gray-50 border border-gray-200 p-6 rounded-2xl shadow-lg mb-8 flex flex-col sm:flex-row justify-between items-center gap-4"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-blue-600 transition-all duration-300 flex items-center gap-2 w-full sm:w-auto justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Filter className="w-5 h-5" />
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </motion.button>

          <motion.button
            onClick={downloadExcel}
            className="bg-green-500 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-green-600 transition-all duration-300 flex items-center gap-2 w-full sm:w-auto justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Download className="w-5 h-5" />
            Descargar Libro Banco (Excel)
          </motion.button>
        </motion.div>

        {/* Filtros */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden bg-gray-50 border border-gray-200 p-6 rounded-2xl shadow-lg mb-8"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">Opciones de Filtrado</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="filterType" className="block text-gray-700 font-medium mb-2">
                    Tipo de Transacción
                  </label>
                  <select
                    id="filterType"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-800"
                  >
                    <option value="all">Todos los Tipos</option>
                    {transactionCategories.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="filterChannel" className="block text-gray-700 font-medium mb-2">
                    Canal de Pago
                  </label>
                  <select
                    id="filterChannel"
                    value={filterChannel}
                    onChange={(e) => setFilterChannel(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-800"
                  >
                    <option value="all">Todos los Canales</option>
                    {paymentChannels.map((channel) => (
                      <option key={channel.value} value={channel.value}>{channel.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="filterBank" className="block text-gray-700 font-medium mb-2">
                    Banco (Solo Pago Móvil/Transferencia)
                  </label>
                  <select
                    id="filterBank"
                    value={filterBank}
                    onChange={(e) => setFilterBank(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-800"
                  >
                    <option value="all">Todos los Bancos</option>
                    {banks.map((b) => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="filterDescription" className="block text-gray-700 font-medium mb-2">
                    Concepto/Descripción
                  </label>
                  <input
                    type="text"
                    id="filterDescription"
                    placeholder="Buscar por descripción..."
                    value={filterDescription}
                    onChange={(e) => setFilterDescription(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-800"
                  />
                </div>
                <div>
                  <label htmlFor="filterStartDate" className="block text-gray-700 font-medium mb-2">
                    Fecha Desde
                  </label>
                  <input
                    type="date"
                    id="filterStartDate"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-800"
                  />
                </div>
                <div>
                  <label htmlFor="filterEndDate" className="block text-gray-700 font-medium mb-2">
                    Fecha Hasta
                  </label>
                  <input
                    type="date"
                    id="filterEndDate"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-800"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabla de Transacciones */}
        <motion.div
          className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h2 className="text-2xl font-bold text-gray-800 p-6 border-b border-gray-200 flex items-center gap-3">
            <Banknote className="w-6 h-6 text-blue-600" />
            Historial de Transacciones
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Concepto/Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto USD
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto BS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tasa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Canal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banco
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo Acumulado USD
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                      No hay transacciones que coincidan con los filtros. ¡Es hora de gastar o ganar algo de dinero!
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction, index) => {
                    let accumulatedBalance = initialBalance;
                    // Recalcular el saldo acumulado para las transacciones filtradas
                    for (let i = 0; i <= index; i++) {
                      if (filteredTransactions[i].transactionType === 'Credito') {
                        accumulatedBalance += filteredTransactions[i].amountUSD;
                      } else {
                        accumulatedBalance -= filteredTransactions[i].amountUSD;
                      }
                    }
                    const CategoryIcon = getIconForCategory(transaction.transactionType);
                    const categoryColor = getColorForCategory(transaction.transactionType);
                    const ChannelIcon = getIconForChannel(transaction.paymentChannel);

                    return (
                      <motion.tr
                        key={transaction.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {transaction.time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.description}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${transaction.transactionType === 'Credito' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.transactionType === 'Credito' ? '+' : '-'} ${transaction.amountUSD.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.amountBS ? transaction.amountBS.toFixed(2) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.exchangeRate ? transaction.exchangeRate.toFixed(2) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 flex items-center gap-2">
                          <CategoryIcon className={`w-4 h-4 ${categoryColor}`} />
                          {transaction.transactionType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 flex items-center gap-2">
                          <ChannelIcon className="w-4 h-4 text-gray-500" />
                          {transaction.paymentChannel}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.bank || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          ${accumulatedBalance.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <motion.button
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-100 transition-colors duration-200"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Trash2 className="w-5 h-5" />
                          </motion.button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default App;