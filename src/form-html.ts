export const formHTML = (t: any) =>
  `<button id="${t.ns}__close" class="${t.ns}__icon-button" type="reset" aria-label="Close"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button><form id="${t.ns}__form"><h1 id="${t.ns}__title">${t.title}</h1><div id="${t.ns}__radio-group" role="radiogroup" aria-label="Feedback type"><input class="${t.ns}__radio" type="radio" id="${t.ns}__radio--issue" name="feedbackType" value="issue" required><label for="${t.ns}__radio--issue" class="${t.ns}__button ${t.ns}__radio-label"><span class="${t.ns}__radio-icon">${t.issueIcon}</span>${t.issueLabel}</label><input class="${t.ns}__radio" type="radio" id="${t.ns}__radio--idea" name="feedbackType" value="idea" required><label for="${t.ns}__radio--idea" class="${t.ns}__button ${t.ns}__radio-label"><span class="${t.ns}__radio-icon">${t.ideaIcon}</span>${t.ideaLabel}</label><input class="${t.ns}__radio" type="radio" id="${t.ns}__radio--other" name="feedbackType" value="other" required><label for="${t.ns}__radio--other" class="${t.ns}__button ${t.ns}__radio-label"><span class="${t.ns}__radio-icon">${t.otherIcon}</span>${t.otherLabel}</label></div><div id="${t.ns}__step2"><textarea id="${t.ns}__message" name="message" type="text" placeholder="${t.placeholder.other}" required rows="2" aria-label="Message"></textarea><button id="${t.ns}__submit" class="${t.ns}__button" type="submit">${t.submitText}</button></div></form><div id="${t.ns}__success"><svg viewBox="0 0 18 18" width="3em" height="3em" role="presentation"><polyline stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="2.705 8.29 7 12.585 15.295 4.29" fill="none" id="${t.ns}__check"/></svg>${t.thankyouText}</div><div id="${t.ns}__footer"><a href="https://www.rowy.io/feedbackfin" target="_blank" rel="noopener">Powered by Rowy</a></div>`;
