// Generated from Selenium IDE flow and stabilized for WebDriver execution
const { Builder, By, Key, until } = require('selenium-webdriver')
const assert = require('assert')

describe('TC_Leave_Apply_Valid', function() {
this.timeout(60000)
let driver

beforeEach(async function() {
  driver = await new Builder().forBrowser('chrome').build()
})

afterEach(async function() {
  await driver.quit();
})

async function login() {
  await driver.get("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login")
  await driver.wait(until.elementLocated(By.name("username")), 15000)
  await driver.findElement(By.name("username")).sendKeys("Admin")
  await driver.wait(until.elementLocated(By.name("password")), 15000)
  await driver.findElement(By.name("password")).sendKeys("admin123")
  await driver.findElement(By.css("button[type='submit']")).click()
  await driver.wait(until.elementLocated(By.linkText("Leave")), 15000)
}

async function clickTopbarItem(text) {
  await driver.wait(until.elementLocated(By.css(".oxd-topbar-body-nav-tab")), 15000)
  await driver.executeScript(`
    const item = [...document.querySelectorAll('.oxd-topbar-body-nav-tab')]
      .find(element => element.innerText.trim() === arguments[0]);
    if (!item) throw new Error('Topbar item not found: ' + arguments[0]);
    item.click();
  `, text)
}

async function clickAnchor(text) {
  await driver.executeScript(`
    const item = [...document.querySelectorAll('a')]
      .find(element => element.innerText.trim() === arguments[0]);
    if (!item) throw new Error('Anchor not found: ' + arguments[0]);
    item.click();
  `, text)
}

async function selectDropdownOption(dropdownIndex, optionText) {
  const dropdowns = await driver.findElements(By.css(".oxd-select-text"))
  await dropdowns[dropdownIndex].click()
  await driver.wait(until.elementLocated(By.css(".oxd-select-dropdown .oxd-select-option")), 10000)
  const options = await driver.findElements(By.css(".oxd-select-dropdown .oxd-select-option"))

  for (const option of options) {
    const text = (await option.getText()).trim()
    if (text === optionText) {
      await option.click()
      return
    }
  }

  throw new Error(`Dropdown option not found: ${optionText}`)
}

async function visibleErrorMessages() {
  const errors = await driver.findElements(By.css(".oxd-input-field-error-message"))
  const messages = []

  for (const error of errors) {
    if (await error.isDisplayed()) {
      messages.push(await error.getText())
    }
  }

  return messages
}

async function chooseEmployee(name) {
  const employeeInput = await driver.findElement(By.xpath("//label[normalize-space()='Employee Name']/ancestor::div[contains(@class,'oxd-input-group')]//input"))
  await employeeInput.sendKeys(name)

  await driver.wait(async () => {
    const optionTexts = await driver.executeScript(`
      return [...document.querySelectorAll('.oxd-autocomplete-dropdown .oxd-autocomplete-option')]
        .map(option => option.innerText.trim());
    `)

    return optionTexts.some(text => text && text !== "Searching...." && text !== "No Records Found")
  }, 15000)

  await driver.wait(async () => {
    const options = await driver.findElements(By.css(".oxd-autocomplete-dropdown .oxd-autocomplete-option"))

    for (const option of options) {
      try {
        const text = (await option.getText()).trim()
        if (text && text !== "Searching...." && text !== "No Records Found") {
          await option.click()
          return true
        }
      } catch (error) {
        return false
      }
    }

    return false
  }, 15000)
}

async function setEntitlementForCurrentUser() {
  await driver.findElement(By.linkText("Leave")).click()
  await clickTopbarItem("Entitlements")
  await clickAnchor("Add Entitlements")
  await driver.wait(until.elementLocated(By.xpath("//*[normalize-space()='Add Leave Entitlement']")), 15000)

  await chooseEmployee("John")
  await selectDropdownOption(0, "CAN - Bereavement")

  const entitlementInput = await driver.findElement(By.xpath("//label[normalize-space()='Entitlement']/ancestor::div[contains(@class,'oxd-input-group')]//input"))
  await entitlementInput.sendKeys(Key.CONTROL, "a")
  await entitlementInput.sendKeys(Key.BACK_SPACE)
  await entitlementInput.sendKeys("50")

  await driver.findElement(By.xpath("//button[normalize-space()='Save']")).click()

  const confirmButtons = await driver.wait(async () => {
    const buttons = await driver.findElements(By.xpath("//button[normalize-space()='Confirm']"))
    if (buttons.length > 0) return buttons

    const errors = await driver.findElements(By.css(".oxd-input-field-error-message"))
    if (errors.length > 0) {
      const messages = await Promise.all(errors.map(error => error.getText()))
      throw new Error(`Entitlement form validation failed: ${messages.join(', ')}`)
    }

    const bodyText = await driver.findElement(By.css("body")).getText()
    if (bodyText.includes("Leave Entitlements")) return []

    return false
  }, 15000)

  if (confirmButtons.length > 0) {
    await confirmButtons[0].click()
  }

  await driver.wait(until.elementLocated(By.css(".oxd-topbar-body-nav-tab")), 15000)
}

function orangeDateFromOffset(offsetDays) {
  const date = new Date(2026, 11, 1)
  date.setDate(date.getDate() + offsetDays)

  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1)
  }

  const year = date.getFullYear()
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `${year}-${day}-${month}`
}

async function clearAndType(element, value) {
  await element.click()
  await element.sendKeys(Key.CONTROL, "a")
  await element.sendKeys(Key.BACK_SPACE)
  await element.sendKeys(value)
  await element.sendKeys(Key.TAB)
}

async function submitApplyForDate(leaveDate) {
  const dropdownText = await driver.findElement(By.css(".oxd-select-text")).getText()
  if (!dropdownText.includes("CAN - Bereavement")) {
    await selectDropdownOption(0, "CAN - Bereavement")
  }

  const dateInputs = await driver.findElements(By.css("input[placeholder='yyyy-dd-mm']"))

  await clearAndType(dateInputs[0], leaveDate)
  await clearAndType(dateInputs[1], leaveDate)

  const textarea = await driver.findElement(By.css("textarea"))
  await textarea.sendKeys(Key.CONTROL, "a")
  await textarea.sendKeys(Key.BACK_SPACE)
  await textarea.sendKeys(`Automation apply leave ${leaveDate}`)

  await driver.findElement(By.xpath("//button[normalize-space()='Apply']")).click()

  for (let attempt = 0; attempt < 30; attempt++) {
    const messages = await visibleErrorMessages()
    if (messages.length > 0) {
      throw new Error(`Apply Leave validation failed: ${messages.join(', ')}`)
    }

    const toastTexts = await Promise.all(
      (await driver.findElements(By.css(".oxd-toast, .oxd-toast-content, .oxd-toast-content-text, .oxd-toast-title")))
        .map(toast => toast.getText())
    )
    const toastText = toastTexts.join(" ")

    if (toastText.includes("Success") || toastText.includes("Successfully")) return "success"
    if (toastText.includes("Failed to Submit")) return "failed-to-submit"
    if (toastText.includes("Error")) return "error"

    await driver.sleep(500)
  }

  return "no-outcome"
}

  it('TC_Leave_Apply_Valid', async function() {
    await login()
    await setEntitlementForCurrentUser()

    await clickAnchor("Apply")
    await driver.wait(until.elementLocated(By.xpath("//*[normalize-space()='Apply Leave']")), 15000)

    await selectDropdownOption(0, "CAN - Bereavement")
    await driver.wait(until.elementLocated(By.xpath("//*[contains(normalize-space(),'50.00 Day(s)') or contains(normalize-space(),'Day(s)')]")), 15000)

    let successfulDate = null

    for (let offset = 0; offset < 15; offset++) {
      const leaveDate = orangeDateFromOffset(offset)
      const result = await submitApplyForDate(leaveDate)

      if (result === "success") {
        successfulDate = leaveDate
        break
      }

      if (result !== "failed-to-submit" && result !== "no-outcome") {
        throw new Error(`Apply Leave failed with unexpected result: ${result}`)
      }
    }

    assert(successfulDate, "Apply Leave did not submit successfully for any tested valid date")
  })
})
