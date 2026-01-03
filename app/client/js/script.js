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
                <li><a href="/transactions">Transactions</a></li>
                <li><a href="/categories">Categories</a></li>
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
        <div id="pagination"></div>
    `;
  }
}
customElements.define("table-section", TableSection);
