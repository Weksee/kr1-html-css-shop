// ===== Элементы страницы =====
const orderDialog = document.getElementById('order-dialog');
const orderForm = document.getElementById('order-form');
const successMessage = document.getElementById('success-message');
const selectedProductInput = document.getElementById('selected-product');

let messageTimer;

// Убираем красные рамки ошибок
function clearErrors() {
  if (!orderForm) {
    return;
  }

  Array.from(orderForm.elements).forEach((element) => {
    element.removeAttribute('aria-invalid');
  });
}

// ===== Модальное окно (есть только на index.html) =====
if (orderDialog) {
  // «Заказать»: записываем товар в скрытое поле и открываем окно
  document.querySelectorAll('.product-card__button').forEach((button) => {
    button.addEventListener('click', () => {
      if (selectedProductInput) {
        selectedProductInput.value = button.dataset.product;
      }
      orderDialog.showModal();
    });
  });

  // Закрытие: кнопка «Закрыть», крестик (data-close-dialog) или клик по тёмному фону
  orderDialog.addEventListener('click', (event) => {
    const isCloseButton = event.target.closest('[data-close-dialog]');
    const isBackdrop = event.target === orderDialog;

    if (isCloseButton || isBackdrop) {
      orderDialog.close();
    }
  });

  // При любом закрытии (в том числе клавишей Esc) очищаем форму
  orderDialog.addEventListener('close', () => {
    if (orderForm) {
      orderForm.reset();
    }
    clearErrors();
  });
}

// ===== Обработка формы (index.html и order.html) =====
if (orderForm) {
  orderForm.addEventListener('submit', (event) => {
    // Отменяем настоящую отправку (backend пока не подключён)
    event.preventDefault();

    clearErrors();

    // Проверяем форму и подсвечиваем ошибочные поля
    if (!orderForm.checkValidity()) {
      Array.from(orderForm.elements).forEach((element) => {
        if (element.willValidate && !element.checkValidity()) {
          element.setAttribute('aria-invalid', 'true');
        }
      });

      orderForm.reportValidity();
      return;
    }

    // Успех: очищаем форму, закрываем окно, показываем уведомление на 4 секунды
    orderForm.reset();

    if (orderDialog) {
      orderDialog.close();
    }

    if (successMessage) {
      successMessage.hidden = false;
      clearTimeout(messageTimer);
      messageTimer = setTimeout(() => {
        successMessage.hidden = true;
      }, 4000);
    }
  });
}



