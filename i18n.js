/* ============================================
   BudgetNest — превключвател на език (BG / EN)

   Работи по същия принцип като тъмната тема: избраният език се пази в
   localStorage и се прилага веднага при зареждане на всяка страница.

   Как се ползва в HTML:
     <span data-i18n="nav.dashboard">Табло</span>
     <input data-i18n-placeholder="goals.name_placeholder" placeholder="...">
     <button data-i18n-title="nav.theme_toggle_title" title="Смяна на тема">

   Как се ползва в JS (за динамично генериран текст, тостове и т.н.):
     BudgetNestI18n.t('goals.added_toast')

   Ако дадена страница трябва да презареди динамичното си съдържание при
   смяна на езика (напр. рендерирани карти с цели), тя си дефинира:
     window.onLanguageChange = function (lang) { renderGoals(); };
   i18n.js ще го извика автоматично след всяка смяна на езика.
   ============================================ */

(function () {
  const STORAGE_KEY = 'budgetnest-lang';

  const translations = {
    bg: {
      // ===== Обща навигация (споделено между всички страници) =====
      'nav.dashboard': 'Табло',
      'nav.transactions': 'Транзакции',
      'nav.budgets': 'Бюджети',
      'nav.wallets': 'Портфейл',
      'nav.goals': 'Цели',
      'nav.recurring': 'Периодични',
      'nav.settle': 'Споделено',
      'nav.reviews': 'Отзиви',
      'nav.settings': 'Настройки',
      'nav.admin': 'Админ',
      'nav.signout': 'Изход',
      'nav.theme_toggle_title': 'Смяна на тема',
      'nav.lang_toggle_title': 'Смяна на език',
      'common.loading': 'Зареждане…',
      'common.error_prefix': 'Грешка: ',
      'common.cancel': 'Отказ',
      'common.save': 'Запази',
      'common.delete': 'Изтрий',
      'common.confirm_title': 'Потвърждение',
      'common.confirm_ok': 'Да, продължи',
      'common.day_singular': 'ден',
      'common.day_plural': 'дни',

      // ===== Цели за спестяване (goals.html) =====
      'goals.page_title': 'Цели за спестяване',
      'goals.page_subtitle': 'задай сума, следи прогреса',
      'goals.new_goal_card_title': 'Нова цел',
      'goals.icon_label': 'Икона (емоджи)',
      'goals.target_amount_label': 'Целева сума (€)',
      'goals.name_label': 'Име на целта',
      'goals.name_placeholder': 'напр. Ваканция в Гърция, Спешен фонд',
      'goals.target_date_label': 'Целева дата',
      'goals.target_date_optional': '(незадължително)',
      'goals.add_goal_button': 'Добави цел',
      'goals.your_goals_title': 'Твоите цели',
      'goals.count_suffix_one': 'цел',
      'goals.count_suffix_other': 'цели',
      'goals.empty_state': 'Все още няма зададени цели. Добави първата по-горе — например „Спешен фонд" или „Ваканция".',
      'goals.saved_label': 'Събрано',
      'goals.target_label': 'Цел',
      'goals.remaining_label': 'Остават',
      'goals.completed_badge': '🎉 Постигната',
      'goals.add_funds_button': '+ Добави',
      'goals.withdraw_button': '− Изтегли',
      'goals.no_contributions_yet': 'Още няма вноски.',
      'goals.you_label': 'Аз',
      'goals.other_member_label': 'Друг член',
      'goals.added_label': 'добави',
      'goals.withdrew_label': 'изтегли',
      'goals.date_until_prefix': '🗓 до',
      'goals.days_left_prefix': 'остават',
      'goals.date_passed': 'датата е минала',
      'goals.edit_modal_title': 'Редакция на цел',
      'goals.edit_modal_icon_label': 'Икона',
      'goals.edit_modal_name_label': 'Име',
      'goals.edit_modal_date_label': 'Целева дата',
      'goals.error_name_required': 'Въведете име на целта.',
      'goals.error_target_invalid': 'Въведете целева сума по-голяма от 0.',
      'goals.error_amount_invalid': 'Въведете валидна сума по-голяма от 0.',
      'goals.toast_added': 'Целта е добавена ✓',
      'goals.toast_updated': 'Целта е обновена ✓',
      'goals.toast_deleted': 'Целта е изтрита',
      'goals.toast_added_funds': 'Сумата е добавена ✓',
      'goals.toast_withdrew_funds': 'Сумата е изтеглена ✓',
      'goals.confirm_delete_title': 'Изтриване на цел',
      'goals.confirm_delete_message': 'Сигурни ли сте, че искате да изтриете целта „{name}"? Историята на вноските също ще бъде изтрита.',

      // ===== Табло (dashboard.html) =====
      'dashboard.summary_income': 'Приходи този месец',
      'dashboard.summary_expense': 'Разходи този месец',
      'dashboard.summary_card': 'В картата',
      'dashboard.summary_cash': 'В брой',
      'dashboard.summary_total': 'Общо',
      'dashboard.view_wallet_title': 'Виж портфейла',
      'dashboard.chart_expense_title': 'Разходи по категория',
      'dashboard.chart_income_title': 'Приходи по категория',
      'dashboard.chart_prev': 'Предишна диаграма',
      'dashboard.chart_next': 'Следваща диаграма',
      'dashboard.chart_view_expense': 'Разходи',
      'dashboard.chart_view_income': 'Приходи',
      'dashboard.chart_empty_expense': 'Все още няма разходи този месец.',
      'dashboard.chart_empty_income': 'Все още няма приходи този месец.',
      'dashboard.recent_tx_title': 'Последни транзакции',
      'dashboard.toggle_visibility_title': 'Скрий/покажи блока',
      'dashboard.recent_empty_title': 'Все още няма транзакции този месец',
      'dashboard.recent_empty_sub': 'Започнете да следите бюджета си — добавете първия си приход или разход.',
      'dashboard.recent_empty_cta': 'Добави транзакция →',
      'dashboard.tx_edit_hint': 'Кликни за редакция или изтриване',
      'dashboard.edit_hint_inline': '✏️ Промени',
      'dashboard.page_label': 'Страница {current} от {total}',
      'dashboard.compare_title': 'Ти срещу средното в България',
      'dashboard.compare_hint': 'в евро, на домакинство',
      'dashboard.compare_avg_label': 'БГ средно',
      'dashboard.templates_title': 'Бързи шаблони',
      'dashboard.templates_hint': 'едно докосване = записана транзакция',
      'dashboard.templates_loading': 'Зареждане…',
      'dashboard.templates_empty': 'Все още нямаш шаблони — добави първия по-долу.',
      'dashboard.template_add_btn': '+ Нов шаблон',
      'dashboard.template_use_title': 'Добави транзакция от този шаблон',
      'dashboard.template_remove_title': 'Изтрий шаблона',
      'dashboard.type_expense': 'Разход',
      'dashboard.type_income': 'Приход',
      'dashboard.template_name_label': 'Име на шаблона',
      'dashboard.template_name_placeholder': 'напр. Цигари',
      'dashboard.amount_label': 'Сума (€)',
      'dashboard.category_label': 'Категория',
      'dashboard.save_template_btn': 'Запази шаблон',
      'dashboard.form_title_quick': 'Бърза транзакция',
      'dashboard.form_title_edit': 'Редактиране на транзакция',
      'dashboard.method_card': '💳 Карта',
      'dashboard.method_cash': '💵 В брой',
      'dashboard.description_label': 'Описание',
      'dashboard.description_placeholder_expense': 'напр. Пазар от Kaufland',
      'dashboard.description_placeholder_income': 'напр. Заплата, Хонорар',
      'dashboard.date_label': 'Дата',
      'dashboard.add_btn': 'Добави',
      'dashboard.trend_title': 'Тенденция по месеци',
      'dashboard.trend_hint': 'приходи и разходи, последните 6 месеца',
      'dashboard.trend_empty': 'Нужни са данни поне от два месеца, за да се покаже тенденция.',
      'dashboard.trend_income': 'Приходи',
      'dashboard.trend_expense': 'Разходи',
      'dashboard.onboarding_title': 'Създайте домакинство',
      'dashboard.onboarding_text': 'Домакинството е споделеното пространство за бюджета ви. Поканете членове на семейството по-късно от Настройки.',
      'dashboard.household_name_label': 'Име на домакинството',
      'dashboard.household_placeholder': 'напр. Семейство Иванови',
      'dashboard.create_btn': 'Създай',
      'dashboard.delete_tx_title': 'Изтриване на транзакция',
      'dashboard.delete_tx_text': 'Сигурни ли сте, че искате окончателно да изтриете тази транзакция? Това действие е необратимо.',
      'dashboard.delete_confirm_btn': 'Да, изтрий',
      'dashboard.invite_title': 'Покана за домакинство',
      'dashboard.invite_text': 'Поканени сте да се присъедините към {household}. Искате ли да приемете поканата?',
      'dashboard.invite_default_household': 'домакинство',
      'dashboard.invite_decline': 'Откажи',
      'dashboard.invite_accept': 'Приеми',
      'dashboard.joining_status': 'Присъединяване…',
      'dashboard.declining_status': 'Отказване…',
      'dashboard.creating_status': 'Създаване…',
      'dashboard.created_success': 'Готово! Зареждане на таблото…',
      'dashboard.saving_status': 'Запазване…',
      'dashboard.saving_changes_status': 'Запазване на промените…',
      'dashboard.adding_status': 'Добавяне…',
      'dashboard.deleting_status': 'Изтриване…',
      'dashboard.delete_error_prefix': 'Грешка при изтриване: ',
      'dashboard.tx_deleted_success': 'Транзакцията е изтрита ✓',
      'dashboard.changes_saved_success': 'Промените са запазени ✓',
      'dashboard.added_success': 'Добавено ✓',
      'dashboard.template_used_success': '„{name}“ е добавен ✓',
      'dashboard.no_category_error': 'Няма налична категория за този тип.',
      'dashboard.you_label': 'Аз',
      'dashboard.other_member_label': 'Друг член',
      'dashboard.other_category_label': 'Друго',
      'dashboard.default_category_food': 'Храна',
      'dashboard.default_category_housing': 'Жилище и наем',
      'dashboard.default_category_transport': 'Транспорт',
      'dashboard.default_category_health': 'Здраве',
      'dashboard.default_category_fun': 'Забавления',
      'dashboard.default_category_other': 'Друго',
      'dashboard.default_category_salary': 'Заплата',
      'dashboard.default_category_other_income': 'Друг приход',
      'dashboard.alert_over_one': 'категория надвиши',
      'dashboard.alert_over_many': 'категории надвишиха',
      'dashboard.alert_near_one': 'категория е близо',
      'dashboard.alert_near_many': 'категории са близо',
      'dashboard.alert_limit_suffix': 'лимита',
      'dashboard.alert_more_near_one': 'Още {n} категория е близо до лимита си.',
      'dashboard.alert_more_near_many': 'Още {n} категории са близо до лимита си.',
      'dashboard.alert_review_text': 'Прегледайте разходите си, за да върнете бюджета под контрол.',
      'dashboard.alert_approaching_text': 'Наближавате зададените месечни лимити.',
      'dashboard.alert_view_budgets': 'Виж бюджетите →',
      'dashboard.month_jan': 'януари', 'dashboard.month_feb': 'февруари', 'dashboard.month_mar': 'март',
      'dashboard.month_apr': 'април', 'dashboard.month_may': 'май', 'dashboard.month_jun': 'юни',
      'dashboard.month_jul': 'юли', 'dashboard.month_aug': 'август', 'dashboard.month_sep': 'септември',
      'dashboard.month_oct': 'октомври', 'dashboard.month_nov': 'ноември', 'dashboard.month_dec': 'декември',
      'dashboard.month_short_jan': 'яну', 'dashboard.month_short_feb': 'фев', 'dashboard.month_short_mar': 'мар',
      'dashboard.month_short_apr': 'апр', 'dashboard.month_short_may': 'май', 'dashboard.month_short_jun': 'юни',
      'dashboard.month_short_jul': 'юли', 'dashboard.month_short_aug': 'авг', 'dashboard.month_short_sep': 'сеп',
      'dashboard.month_short_oct': 'окт', 'dashboard.month_short_nov': 'ное', 'dashboard.month_short_dec': 'дек',
    },

    en: {
      // ===== Shared navigation =====
      'nav.dashboard': 'Dashboard',
      'nav.transactions': 'Transactions',
      'nav.budgets': 'Budgets',
      'nav.wallets': 'Wallet',
      'nav.goals': 'Goals',
      'nav.recurring': 'Recurring',
      'nav.settle': 'Shared',
      'nav.reviews': 'Reviews',
      'nav.settings': 'Settings',
      'nav.admin': 'Admin',
      'nav.signout': 'Sign out',
      'nav.theme_toggle_title': 'Toggle theme',
      'nav.lang_toggle_title': 'Switch language',
      'common.loading': 'Loading…',
      'common.error_prefix': 'Error: ',
      'common.cancel': 'Cancel',
      'common.save': 'Save',
      'common.delete': 'Delete',
      'common.confirm_title': 'Confirm',
      'common.confirm_ok': 'Yes, continue',
      'common.day_singular': 'day',
      'common.day_plural': 'days',

      // ===== Savings goals (goals.html) =====
      'goals.page_title': 'Savings Goals',
      'goals.page_subtitle': 'set an amount, track your progress',
      'goals.new_goal_card_title': 'New Goal',
      'goals.icon_label': 'Icon (emoji)',
      'goals.target_amount_label': 'Target amount (€)',
      'goals.name_label': 'Goal name',
      'goals.name_placeholder': 'e.g. Trip to Greece, Emergency fund',
      'goals.target_date_label': 'Target date',
      'goals.target_date_optional': '(optional)',
      'goals.add_goal_button': 'Add goal',
      'goals.your_goals_title': 'Your goals',
      'goals.count_suffix_one': 'goal',
      'goals.count_suffix_other': 'goals',
      'goals.empty_state': 'No goals yet. Add your first one above — for example, an "Emergency fund" or a "Vacation".',
      'goals.saved_label': 'Saved',
      'goals.target_label': 'Target',
      'goals.remaining_label': 'Remaining',
      'goals.completed_badge': '🎉 Reached',
      'goals.add_funds_button': '+ Add',
      'goals.withdraw_button': '− Withdraw',
      'goals.no_contributions_yet': 'No contributions yet.',
      'goals.you_label': 'Me',
      'goals.other_member_label': 'Another member',
      'goals.added_label': 'added',
      'goals.withdrew_label': 'withdrew',
      'goals.date_until_prefix': '🗓 by',
      'goals.days_left_prefix': 'in',
      'goals.date_passed': 'date has passed',
      'goals.edit_modal_title': 'Edit goal',
      'goals.edit_modal_icon_label': 'Icon',
      'goals.edit_modal_name_label': 'Name',
      'goals.edit_modal_date_label': 'Target date',
      'goals.error_name_required': 'Please enter a name for the goal.',
      'goals.error_target_invalid': 'Please enter a target amount greater than 0.',
      'goals.error_amount_invalid': 'Please enter a valid amount greater than 0.',
      'goals.toast_added': 'Goal added ✓',
      'goals.toast_updated': 'Goal updated ✓',
      'goals.toast_deleted': 'Goal deleted',
      'goals.toast_added_funds': 'Amount added ✓',
      'goals.toast_withdrew_funds': 'Amount withdrawn ✓',
      'goals.confirm_delete_title': 'Delete goal',
      'goals.confirm_delete_message': 'Are you sure you want to delete the goal "{name}"? Its contribution history will be deleted too.',

      // ===== Dashboard (dashboard.html) =====
      'dashboard.summary_income': 'Income this month',
      'dashboard.summary_expense': 'Expenses this month',
      'dashboard.summary_card': 'On card',
      'dashboard.summary_cash': 'Cash',
      'dashboard.summary_total': 'Total',
      'dashboard.view_wallet_title': 'View wallet',
      'dashboard.chart_expense_title': 'Expenses by category',
      'dashboard.chart_income_title': 'Income by category',
      'dashboard.chart_prev': 'Previous chart',
      'dashboard.chart_next': 'Next chart',
      'dashboard.chart_view_expense': 'Expenses',
      'dashboard.chart_view_income': 'Income',
      'dashboard.chart_empty_expense': 'No expenses yet this month.',
      'dashboard.chart_empty_income': 'No income yet this month.',
      'dashboard.recent_tx_title': 'Recent transactions',
      'dashboard.toggle_visibility_title': 'Show/hide this section',
      'dashboard.recent_empty_title': 'No transactions yet this month',
      'dashboard.recent_empty_sub': 'Start tracking your budget — add your first income or expense.',
      'dashboard.recent_empty_cta': 'Add a transaction →',
      'dashboard.tx_edit_hint': 'Click to edit or delete',
      'dashboard.edit_hint_inline': '✏️ Edit',
      'dashboard.page_label': 'Page {current} of {total}',
      'dashboard.compare_title': 'You vs. the Bulgarian average',
      'dashboard.compare_hint': 'in euros, per household',
      'dashboard.compare_avg_label': 'BG average',
      'dashboard.templates_title': 'Quick templates',
      'dashboard.templates_hint': 'one tap = a recorded transaction',
      'dashboard.templates_loading': 'Loading…',
      'dashboard.templates_empty': "You don't have any templates yet — add your first one below.",
      'dashboard.template_add_btn': '+ New template',
      'dashboard.template_use_title': 'Add a transaction from this template',
      'dashboard.template_remove_title': 'Delete this template',
      'dashboard.type_expense': 'Expense',
      'dashboard.type_income': 'Income',
      'dashboard.template_name_label': 'Template name',
      'dashboard.template_name_placeholder': 'e.g. Cigarettes',
      'dashboard.amount_label': 'Amount (€)',
      'dashboard.category_label': 'Category',
      'dashboard.save_template_btn': 'Save template',
      'dashboard.form_title_quick': 'Quick transaction',
      'dashboard.form_title_edit': 'Edit transaction',
      'dashboard.method_card': '💳 Card',
      'dashboard.method_cash': '💵 Cash',
      'dashboard.description_label': 'Description',
      'dashboard.description_placeholder_expense': 'e.g. Groceries at Kaufland',
      'dashboard.description_placeholder_income': 'e.g. Salary, Freelance payment',
      'dashboard.date_label': 'Date',
      'dashboard.add_btn': 'Add',
      'dashboard.trend_title': 'Monthly trend',
      'dashboard.trend_hint': 'income and expenses, last 6 months',
      'dashboard.trend_empty': 'At least two months of data are needed to show a trend.',
      'dashboard.trend_income': 'Income',
      'dashboard.trend_expense': 'Expenses',
      'dashboard.onboarding_title': 'Create a household',
      'dashboard.onboarding_text': 'A household is the shared space for your budget. You can invite family members later from Settings.',
      'dashboard.household_name_label': 'Household name',
      'dashboard.household_placeholder': 'e.g. The Smith Family',
      'dashboard.create_btn': 'Create',
      'dashboard.delete_tx_title': 'Delete transaction',
      'dashboard.delete_tx_text': 'Are you sure you want to permanently delete this transaction? This action cannot be undone.',
      'dashboard.delete_confirm_btn': 'Yes, delete',
      'dashboard.invite_title': 'Household invitation',
      'dashboard.invite_text': 'You have been invited to join {household}. Would you like to accept?',
      'dashboard.invite_default_household': 'this household',
      'dashboard.invite_decline': 'Decline',
      'dashboard.invite_accept': 'Accept',
      'dashboard.joining_status': 'Joining…',
      'dashboard.declining_status': 'Declining…',
      'dashboard.creating_status': 'Creating…',
      'dashboard.created_success': 'Done! Loading your dashboard…',
      'dashboard.saving_status': 'Saving…',
      'dashboard.saving_changes_status': 'Saving changes…',
      'dashboard.adding_status': 'Adding…',
      'dashboard.deleting_status': 'Deleting…',
      'dashboard.delete_error_prefix': 'Error deleting: ',
      'dashboard.tx_deleted_success': 'Transaction deleted ✓',
      'dashboard.changes_saved_success': 'Changes saved ✓',
      'dashboard.added_success': 'Added ✓',
      'dashboard.template_used_success': '"{name}" added ✓',
      'dashboard.no_category_error': 'No category available for this type.',
      'dashboard.you_label': 'Me',
      'dashboard.other_member_label': 'Another member',
      'dashboard.other_category_label': 'Other',
      'dashboard.default_category_food': 'Food',
      'dashboard.default_category_housing': 'Housing & rent',
      'dashboard.default_category_transport': 'Transport',
      'dashboard.default_category_health': 'Health',
      'dashboard.default_category_fun': 'Entertainment',
      'dashboard.default_category_other': 'Other',
      'dashboard.default_category_salary': 'Salary',
      'dashboard.default_category_other_income': 'Other income',
      'dashboard.alert_over_one': 'category has exceeded',
      'dashboard.alert_over_many': 'categories have exceeded',
      'dashboard.alert_near_one': 'category is close to',
      'dashboard.alert_near_many': 'categories are close to',
      'dashboard.alert_limit_suffix': 'its limit',
      'dashboard.alert_more_near_one': '{n} more category is close to its limit.',
      'dashboard.alert_more_near_many': '{n} more categories are close to their limit.',
      'dashboard.alert_review_text': 'Review your spending to bring your budget back under control.',
      'dashboard.alert_approaching_text': "You're approaching your set monthly limits.",
      'dashboard.alert_view_budgets': 'View budgets →',
      'dashboard.month_jan': 'January', 'dashboard.month_feb': 'February', 'dashboard.month_mar': 'March',
      'dashboard.month_apr': 'April', 'dashboard.month_may': 'May', 'dashboard.month_jun': 'June',
      'dashboard.month_jul': 'July', 'dashboard.month_aug': 'August', 'dashboard.month_sep': 'September',
      'dashboard.month_oct': 'October', 'dashboard.month_nov': 'November', 'dashboard.month_dec': 'December',
      'dashboard.month_short_jan': 'Jan', 'dashboard.month_short_feb': 'Feb', 'dashboard.month_short_mar': 'Mar',
      'dashboard.month_short_apr': 'Apr', 'dashboard.month_short_may': 'May', 'dashboard.month_short_jun': 'Jun',
      'dashboard.month_short_jul': 'Jul', 'dashboard.month_short_aug': 'Aug', 'dashboard.month_short_sep': 'Sep',
      'dashboard.month_short_oct': 'Oct', 'dashboard.month_short_nov': 'Nov', 'dashboard.month_short_dec': 'Dec',
    },
  };

  function getLang() {
    return localStorage.getItem(STORAGE_KEY) || 'bg';
  }

  function interpolate(str, vars) {
    if (!vars) return str;
    return str.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
  }

  // t('goals.confirm_delete_message', { name: 'Ваканция' })
  function t(key, vars) {
    const lang = getLang();
    const dict = translations[lang] || translations.bg;
    const str = (key in dict) ? dict[key] : (translations.bg[key] || key);
    return interpolate(str, vars);
  }

  function applyTranslations(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    scope.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
    scope.querySelectorAll('[data-i18n-title]').forEach((el) => {
      el.title = t(el.getAttribute('data-i18n-title'));
    });
    document.documentElement.lang = getLang() === 'bg' ? 'bg' : 'en';
  }

  function updateToggleButton() {
    const btn = document.getElementById('lang-toggle-btn');
    if (!btn) return;
    // Копчето показва езика, на който ще превключиш (не текущия) — същия
    // принцип, по който иконата на темата показва слънце/луна за ДРУГОТО
    // състояние, не текущото.
    btn.textContent = getLang() === 'bg' ? 'EN' : 'БГ';
  }

  function setLang(lang) {
    localStorage.setItem(STORAGE_KEY, lang);
    applyTranslations();
    updateToggleButton();
    if (typeof window.onLanguageChange === 'function') {
      window.onLanguageChange(lang);
    }
  }

  function toggleLang() {
    setLang(getLang() === 'bg' ? 'en' : 'bg');
  }

  window.BudgetNestI18n = { t, getLang, setLang, toggleLang, applyTranslations };
  window.toggleLang = toggleLang; // за директен onclick="toggleLang()" в HTML

  function init() {
    applyTranslations();
    updateToggleButton();
    if (typeof window.onLanguageChange === 'function') {
      window.onLanguageChange(getLang());
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
