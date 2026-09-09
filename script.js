const dateInput = document.querySelector('#date');
const bookingForm = document.querySelector('#booking-form');
const successMessage = document.querySelector('#success-message');
const categoryInput = document.querySelector('#category');
const serviceInput = document.querySelector('#service');
const calendarDays = document.querySelector('#calendar-days');
const calendarMonth = document.querySelector('#calendar-month');
const timeOptions = document.querySelector('#time-options');
const previousMonth = document.querySelector('#previous-month');
const nextMonth = document.querySelector('#next-month');
const supabaseClient = window.supabase && window.SUPABASE_CONFIG
  ? window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey)
  : null;
let remoteBookings = [];
let remoteReady = false;

const servicesByCategory = {
  peluqueria: ['Corte', 'Lavado y corte', 'Brushing recto', 'Brushing con movimiento', 'Tinta', 'Claritos y mechas', 'Peinados', 'Baño de hidratación', 'Botox orgánico', 'Progresivos', 'Hidro cauterización'],
  depilacion: ['Depilación de bozo', 'Depilación de cejas', 'Axila', 'Cavado completo', 'Pierna entera', 'Media pierna', 'Tira de cola', 'Bikini'],
  manicura: ['Semi permanente sin diseño', 'Semi permanente con diseño', 'Kaping', 'Soft gel', 'Esmaltado común'],
  pedicura: ['Estética de pies', 'Callos y uñas encarnadas']
};
const intervalByCategory = { peluqueria: 60, depilacion: 100, manicura: 120, pedicura: 120 };
const today = new Date();
const todayKey = new Date(today.getFullYear(), today.getMonth(), today.getDate());
let visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDate = '';

function toDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getTimeSlots(category) {
  const interval = intervalByCategory[category];
  if (!interval) return [];
  const slots = [];
  for (let minutes = 600; minutes <= 1080; minutes += interval) {
    slots.push(`${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`);
  }
  return slots;
}

async function loadBookings() {
  if (supabaseClient) {
    const { data, error } = await supabaseClient.from('bookings').select('booking_date, booking_time, category');
    if (!error) {
      remoteBookings = data || [];
      remoteReady = true;
      return;
    }
  }
  remoteBookings = JSON.parse(localStorage.getItem('jazmin-bookings') || '[]');
}

function isSlotTaken(dateKey, time) {
  return remoteBookings.some((booking) => {
    const bookingDate = booking.booking_date || booking.date;
    const bookingTime = String(booking.booking_time || booking.time).slice(0, 5);
    return bookingDate === dateKey && booking.category === categoryInput.value && bookingTime === time;
  });
}

function isOccupied(dateKey) {
  const category = categoryInput.value;
  const slots = getTimeSlots(category);
  return slots.length > 0 && slots.every((time) => isSlotTaken(dateKey, time));
}

async function renderCalendar() {
  await loadBookings();
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  calendarMonth.textContent = visibleMonth.toLocaleDateString('es-UY', { month: 'long', year: 'numeric' });
  calendarDays.innerHTML = '';
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let index = 0; index < firstDay; index += 1) calendarDays.appendChild(document.createElement('span'));
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = toDateKey(year, month, day);
    const date = new Date(year, month, day);
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = day;
    button.dataset.date = key;
    const unavailable = date < todayKey || date.getDay() === 0 || isOccupied(key);
    button.className = unavailable ? 'calendar-day occupied' : 'calendar-day available';
    button.disabled = unavailable;
    if (key === selectedDate) button.classList.add('selected');
    button.addEventListener('click', () => selectDate(key));
    calendarDays.appendChild(button);
  }
}

async function selectDate(dateKey) {
  selectedDate = dateKey;
  dateInput.value = dateKey;
  await renderCalendar();
  renderTimes();
}

function renderTimes() {
  const category = categoryInput.value;
  if (!category || !selectedDate) {
    timeOptions.innerHTML = '<p class="form-hint">Elegí un apartado y una fecha para ver los horarios.</p>';
    return;
  }
  const slots = getTimeSlots(category);
  timeOptions.innerHTML = '';
  slots.forEach((value) => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    const span = document.createElement('span');
    input.type = 'radio'; input.name = 'time'; input.value = value; input.required = true;
    const occupied = isSlotTaken(selectedDate, value);
    input.disabled = occupied;
    span.textContent = value + (occupied ? ' · ocupado' : '');
    label.append(input, span); timeOptions.appendChild(label);
  });
}

categoryInput.addEventListener('change', async () => {
  serviceInput.innerHTML = '<option value="">Elegí qué te vas a hacer</option>';
  servicesByCategory[categoryInput.value]?.forEach((service) => serviceInput.add(new Option(service, service)));
  serviceInput.disabled = !categoryInput.value;
  await renderCalendar();
  renderTimes();
});
previousMonth.addEventListener('click', async () => { visibleMonth.setMonth(visibleMonth.getMonth() - 1); await renderCalendar(); });
nextMonth.addEventListener('click', async () => { visibleMonth.setMonth(visibleMonth.getMonth() + 1); await renderCalendar(); });
renderCalendar();
bookingForm.addEventListener('invalid', () => bookingForm.classList.add('was-submitted'), true);

bookingForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  bookingForm.classList.add('was-submitted');
  if (!bookingForm.checkValidity()) {
    bookingForm.reportValidity();
    return;
  }

  const service = document.querySelector('#service').value;
  const date = new Date(`${dateInput.value}T12:00:00`).toLocaleDateString('es-UY', { day: 'numeric', month: 'long' });
  const time = document.querySelector('input[name="time"]:checked').value;
  const name = document.querySelector('#name').value.trim();
  const phone = document.querySelector('#phone').value.trim();
  const message = `Hola, peluquería Jazmin. Soy ${name} y quiero reservar ${service} para el ${date} a las ${time}. Mi WhatsApp es ${phone}.`;

  successMessage.textContent = `¡Gracias, ${name}! Preparamos tu solicitud para el ${date} a las ${time}.`;
  successMessage.classList.add('visible');
  const booking = { booking_date: dateInput.value, booking_time: time, category: categoryInput.value, service };
  if (supabaseClient) {
    const { error } = await supabaseClient.from('bookings').insert(booking);
    if (error) {
      successMessage.textContent = error.code === '23505' ? 'Ese horario acaba de ser reservado. Elegí otro, por favor.' : 'No pudimos guardar el turno. Intentá nuevamente.';
      successMessage.classList.add('visible');
      await renderCalendar();
      renderTimes();
      return;
    }
  } else {
    const savedBookings = JSON.parse(localStorage.getItem('jazmin-bookings') || '[]');
    savedBookings.push({ date: dateInput.value, time, category: categoryInput.value, service });
    localStorage.setItem('jazmin-bookings', JSON.stringify(savedBookings));
  }
  await renderCalendar();
  window.open(`https://wa.me/59898970866?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.service-card, .gallery figure, .values-list > div').forEach((element) => {
  element.classList.add('scroll-reveal');
  revealObserver.observe(element);
});
