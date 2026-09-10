const supabase = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
const loginPanel = document.querySelector('#login-panel');
const dashboard = document.querySelector('#dashboard');
const loginForm = document.querySelector('#login-form');
const loginMessage = document.querySelector('#login-message');
const dashboardMessage = document.querySelector('#dashboard-message');
const bookingList = document.querySelector('#booking-list');
const filterDate = document.querySelector('#filter-date');

function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function categoryName(value) {
  return { peluqueria: 'Peluquería', depilacion: 'Depilación', manicura: 'Manicura', pedicura: 'Pedicura' }[value] || value;
}

async function loadBookings() {
  dashboardMessage.textContent = 'Cargando reservas...';
  let query = supabase.from('bookings').select('booking_date, booking_time, category, service, client_name, client_phone').order('booking_date').order('booking_time');
  if (filterDate.value) query = query.eq('booking_date', filterDate.value);
  const { data, error } = await query;
  if (error) {
    dashboardMessage.textContent = 'No se pudieron cargar las reservas. Revisá las políticas de Supabase.';
    return;
  }
  bookingList.innerHTML = '';
  if (!data.length) {
    bookingList.innerHTML = '<tr><td colspan="6">No hay reservas para esta fecha.</td></tr>';
  } else {
    data.forEach((booking) => {
      const row = document.createElement('tr');
      const phone = booking.client_phone.replace(/[^0-9+]/g, '');
      row.innerHTML = `<td>${formatDate(booking.booking_date)}</td><td>${String(booking.booking_time).slice(0, 5)}</td><td>${booking.client_name}</td><td><a href="https://wa.me/${phone}" target="_blank" rel="noreferrer">${booking.client_phone}</a></td><td>${categoryName(booking.category)}</td><td>${booking.service}</td>`;
      bookingList.appendChild(row);
    });
  }
  dashboardMessage.textContent = `${data.length} reserva${data.length === 1 ? '' : 's'} encontrada${data.length === 1 ? '' : 's'}.`;
}

async function showSession(session) {
  if (!session) {
    loginPanel.hidden = false;
    dashboard.hidden = true;
    return;
  }
  loginPanel.hidden = true;
  dashboard.hidden = false;
  await loadBookings();
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginMessage.textContent = 'Ingresando...';
  const { data, error } = await supabase.auth.signInWithPassword({ email: document.querySelector('#email').value, password: document.querySelector('#password').value });
  if (error) {
    loginMessage.textContent = 'Correo o contraseña incorrectos.';
    return;
  }
  await showSession(data.session);
});

document.querySelector('#logout').addEventListener('click', async () => { await supabase.auth.signOut(); await showSession(null); });
document.querySelector('#refresh').addEventListener('click', loadBookings);
filterDate.addEventListener('change', loadBookings);
supabase.auth.getSession().then(({ data }) => showSession(data.session));
