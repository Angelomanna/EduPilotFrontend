import {createI18nInstance} from './i18n.js';
import {css, html} from 'lit-element';
import {ScopedElementsMixin} from '@open-wc/scoped-elements';
import * as commonUtils from '@dbp-toolkit/common/utils';
import {Button, Icon} from '@dbp-toolkit/common';
import * as commonStyles from '@dbp-toolkit/common/styles';
import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element';
import QRCode from "webcomponent-qr-code/qr-code";

const i18n = createI18nInstance();


class IssueGrades extends ScopedElementsMixin(DBPLitElement) {
    constructor() {
        super();
        this.lang = i18n.language;
        this.exporting = false;

        this.fetchCourseGrades().then((grades) => {
            this.courseGrades = grades;
        });
    }

    static get scopedElements() {
        return {
          'dbp-icon': Icon,
            'dbp-button': Button,
            'dbp-qr-code': QRCode,
        };
    }

    static get properties() {
        return {
            lang: { type: String },
            exporting: { type: Boolean, attribute: false },
            exportingId: { type: String },
            courseGrades: { type: Array },
        };
    }

    connectedCallback() {
        super.connectedCallback();
    }

    update(changedProperties) {
        changedProperties.forEach((oldValue, propName) => {
            switch (propName) {
                case "lang":
                    i18n.changeLanguage(this.lang);
                    break;
            }
        });

        super.update(changedProperties);
    }

    static get styles() {
        // language=css
        return css`
            ${commonStyles.getThemeCSS()}

            .vc-list {
                list-style: none;
                padding: 0;
            }

            .vc-list li {
                display: flex;
                justify-content: space-between;
                margin-bottom: 1rem;
            }
        `;
    }

    export(id) {
        console.log('export');
        this.exporting = true;
        this.exportingId = id;
    }

    async httpGetAsync(url, options) {
        let response = await fetch(url, options).then(result => {
            if (!result.ok) throw result;
            return result.json();
        });

        return response;
    }

    async fetchCourseGrades() {
        const options = {
            headers: {
                Authorization: "Bearer " + window.DBPAuthToken
            }
        };
        const baseUrl = 'http://127.0.0.1:8000/';
        const url = baseUrl + 'course_grades?page=1';
        const resp = await this.httpGetAsync(url, options);
        return resp['hydra:member'];
    }

    // todo: maybe derive diploma and grades from the same activity
    render() {
        if (!window.DBPAuthToken) {
            return html`
                <p>${i18n.t('please-login')}</p>
            `;
        }

        if (!this.exporting) {
            const coursesList = this.courseGrades.map((d) => html`
                <li>
                    <div>
                        <strong>${d.name}</strong><br />
                        ${d.credits} ECTS<br />
                        ${d.grade} Grade<br />
                        ${d.achievenmentDate}<br />
                    </div>
                    <dbp-button type="is-primary" value="Export" no-spinner-on-click="true" @click="${() => this.export(d['@id'])}" />
                </li>
            `);

            return html`
                <ul class="vc-list">
                    ${coursesList}
                </ul>
            `;
        }
        const qrData = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJ2YyI6eyJjcmVkZW50aWFsU3ViamVjdCI6eyJkZWdyZWUiOnsidHlwZSI6IkJhY2hlbG9yRGVncmVlIiwibmFtZSI6IkJhY2hlbG9yIG9mIFNjaWVuY2UgYW5kIEFydHMifX0sIkBjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIiwiaHR0cHM6Ly93d3cudzMub3JnLzIwMTgvY3JlZGVudGlhbHMvZXhhbXBsZXMvdjEiXSwidHlwZSI6WyJWZXJpZmlhYmxlQ3JlZGVudGlhbCIsIlVuaXZlcnNpdHlEZWdyZWVDcmVkZW50aWFsIl19LCJzdWIiOiIiLCJuYmYiOjE2MTI0MjY5OTYsImlzcyI6ImRpZDpldGhyOmFydGlzX3QxOjB4MWViOWEwZDk5YjE4Yjc4YjJmNjdhNDBmYTA5ZmRhODQ2MzVlZjk2NyJ9.7upzlCL3FJieO35TQa4_y9PlmEotXKphtRd9cstWt4Db2LICBl9RT3_aRl0aBRlHs29JJKQWEMSLwnWJOXsYAw';

        return html`
            <p>
                ${i18n.t('issue-grades.scan')}
            </p>

            <pre>${JSON.stringify(this.courseGrades.filter((c) => c['@id'] === this.exportingId)[0], null, 2)}</pre>

            <dbp-qr-code
              data="${qrData}"
              format="svg"
              modulesize="5"
              margin="1"
            ></dbp-qr-code><br />

            <p>
                ${i18n.t('wallets')}
            </p>
            <ul>
                <li><a href="http://minerva.digital/" target="_blank">Minerva Wallet</a></li>
                <li>Browser wallet</li>
            </ul>
        `;
    }
}

commonUtils.defineCustomElement('issue-grades', IssueGrades);
