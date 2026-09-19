const header = document.querySelector('.topbar');
const navigation = header?.querySelector('nav');

if (navigation) {
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'mobile-menu-toggle';
  toggle.innerHTML = '<span aria-hidden="true">☰</span><span>選單</span>';
  navigation.id = 'header-navigation';
  navigation.setAttribute('aria-label', '主要導覽');
  toggle.setAttribute('aria-controls', navigation.id);
  toggle.setAttribute('aria-expanded', 'false');
  header.insertBefore(toggle, navigation);
  header.classList.add('has-mobile-menu');

  const setOpen = (open) => {
    header.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '關閉選單' : '開啟選單');
    toggle.firstElementChild.textContent = open ? '×' : '☰';
  };
  setOpen(false);
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('click', (event) => {
    if (!header.contains(event.target)) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });
  window.matchMedia('(max-width: 900px)').addEventListener('change', () => setOpen(false));
}
