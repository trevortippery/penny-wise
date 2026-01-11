// app header web component
class AHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
    <header>
        <nav class="navbar">
            <ul class="nav-left">
                <li>
                    <a class="logo-container" href="/dashboard">
                        <h1 class="logo-text">Home</h1>
                    </a>
                </li>
            </ul>
            <ul class="nav-right">
                <li>
                    <span
                        onclick="toggle()"
                        class="fa-solid fa-circle-half-stroke theme"
                    ></span>
                </li>
                <li><a href="/account">Profile</a></li>
                <li><button class="sign-out">Sign Out</button></li>
            </ul>
        </nav>
    </header>
    `;
  }
}
customElements.define("a-header", AHeader);

// table section web component
class TableSection extends HTMLElement {
  connectedCallback() {
    const sectionClass = this.getAttribute("sectionClass");
    const tableH2 = this.getAttribute("tableH2");
    const addLink = this.getAttribute("addLink");
    const addClass = this.getAttribute("addClass");
    const buttonText = this.getAttribute("buttonText");
    const tableClass = this.getAttribute("tableClass");
    const tableBody = this.getAttribute("tableBody");
    const tablePagination = this.getAttribute("tablePagination");

    this.className = sectionClass;

    this.innerHTML = `
        <div class="table-heading">
            <h2>${tableH2}</h2>
            <a href="${addLink}" class="${addClass}">
                <button>${buttonText}</button>
            </a>
        </div>
        <table class="${tableClass}">

            <tbody class="${tableBody}"></tbody>
        </table>
        <div class="${tablePagination}"></div>
    `;
  }
}
customElements.define("table-section", TableSection);

class AFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer><span>&copy; 2026 Penny-Wise. Practice Project.<span></footer>
      `;
  }
}
customElements.define("a-footer", AFooter);

class FSection extends HTMLElement {
  connectedCallback() {
    const formSubmissionFn = this.getAttribute("formSubmissionFn");
    const buttonText = this.getAttribute("buttonText");
    const h2Text = this.getAttribute("h2Text");
    this.innerHTML = `
      <section class="form-section">
        <h2>${h2Text}</h2>
        <form onsubmit="${formSubmissionFn}">
            <div class="form-group">
                <label for="type">Type *</label>
                <select id="type" name="type" required>
                  <option value="" disabled selected>
                      Select a type
                  </option>
                  <option value="deposit">Deposit</option>
                  <option value="withdraw">Withdraw</option>
                </select>
            </div>
            <div class="form-group">
                <label for="category">Category *</label>
                <select
                    id="category"
                    name="category"
                    required
                ></select>
            </div>
            <div class="form-group">
                <label for="amount">Amount *</label>
                <input
                    type="number"
                    step="0.01"
                    id="amount"
                    name="amount"
                    required
                />
            </div>
            <div class="form-group">
                <label for="description">Description</label>
                <textarea
                    id="description"
                    name="description"
                ></textarea>
            </div>
            <div class="form-group">
                <label for="date">Date *</label>
                <input type="date" id="date" name="date" required />
            </div>
            <button type="submit">${buttonText}</button>
        </form>
        <a href="/dashboard"><- Back to dashboard</a>
      </section>`;
  }
}
customElements.define("f-section", FSection);

// Form, category, section (FCSection)
class FCSection extends HTMLElement {
  connectedCallback() {
    const formSubmissionFn = this.getAttribute("formSubmissionFn");
    const text = this.getAttribute("text");

    this.innerHTML = `
      <section class="form-section">
          <h2>${text}</h2>
          <form onsubmit="${formSubmissionFn}">
              <div class="form-group">
                  <label for="name">Category name *</label>
                  <input
                      class="category-name"
                      type="text"
                      id="name"
                      name="name"
                      required
                  />
              </div>
              <div class="form-group">
                  <label for="categoryColor">
                      Select color to represent the category
                  </label>
                  <input
                      type="color"
                      id="categoryColor"
                      name="categoryColor"
                      value="#ff0000"
                  />
              </div>
              <button type="submit">${text}</button>
          </form>
          <a href="/dashboard"><- Back to dashboard</a>
      </section>`;
  }
}

customElements.define("fc-section", FCSection);
