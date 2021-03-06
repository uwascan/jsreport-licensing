import Studio from 'jsreport-studio'

function renderLicenseType (licensingInfo) {
  if (licensingInfo.unreachable) {
    return <p>
        The licensing server was not reachable during the instance startup. The instance now runs in the enterprise mode and the license validation will be performed again during the next restart.
    </p>
  }

  if (licensingInfo.type === 'subscription') {
    if (licensingInfo.pendingExpiration === true) {
      return <p>
        The subscription is no longer active probably due to failed payment or cancellation. The subscription can be used for maximum one month in inactive state.
        Please verify the state of your subscription in the <a href='https://gumroad.com/library' target='_blank'>gumroad library</a>.
      </p>
    }

    return <p>The subscription renewal is planned on {licensingInfo.expiresOn.toLocaleDateString()} and the license will be again validated afterwards.
      You can find further information about the particular subscription charges in <a href='https://gumroad.com/library' target='_blank'>gumroad library</a>.
    </p>
  }

  if (licensingInfo.type === 'perpetual') {
    return <p>Perpetual license is validated for the version {licensingInfo.validatedForVersion} with free upgrades to the versions released before {licensingInfo.expiresOn.toLocaleDateString()}.
      The license will be remotely validated again if the instance is upgraded to a different version.</p>
  }

  if (licensingInfo.type === 'trial') {
    return <p>The trial license expires on {licensingInfo.expiresOn.toLocaleDateString()}.
      You will need to purchase enterprise license to be able to store more than 5 templates afterwards.</p>
  }

  if (licensingInfo.type === 'free') {
    return <p>You can use up to 5 templates for free.</p>
  }
}

Studio.readyListeners.push(async () => {
  var licensingInfo = Studio.extensions['licensing'].options
  const trialModal = () => Studio.openModal(() => <div>
    <p>
      Free license is limited to maximum 5 templates.
      Your jsreport instance is now running in one month trial. Please buy
      the enterprise license if you want to continue using jsreport after the trial expires.
    </p>

    <p>
      The instructions for buying enterprise license can be found <a href='http://jsreport.net/buy' target='_blank'>here</a>.
    </p>
  </div>)

  const licenseInfoModal = () => Studio.openModal(() => <div>
    <h2>{licensingInfo.license} license</h2>
    {renderLicenseType(licensingInfo)}
    <p>More information about licensing and pricing can be found <a href='http://jsreport.net/buy' target='_blank'>here</a>.</p>
  </div>)

  const pendingExpirationModal = () => Studio.openModal(() => <div>
    <h2>subscription has expired</h2>
    <p>
      The subscription is no longer active probably due to failed payment or cancellation. The subscription can be used for maximum one month in inactive state.
      Please verify the state of your subscription in the <a href='https://gumroad.com/library' target='_blank'>gumroad library</a>.
    </p>
  </div>)

  if (licensingInfo.type === 'trial' && Studio.getAllEntities().filter((e) => e.__entitySet === 'templates' && !e.__isNew).length > 5) {
    trialModal()
  }

  if (licensingInfo.type === 'subscription' && licensingInfo.pendingExpiration === true) {
    pendingExpirationModal()
  }

  if (licensingInfo.license === 'free') {
    const interval = setInterval(() => {
      if (Studio.getAllEntities().filter((e) => e.__entitySet === 'templates' && !e.__isNew).length > 5) {
        clearInterval(interval)
        trialModal()
        licensingInfo.type = licensingInfo.license = 'trial'
        var now = new Date()
        now.setDate(now.getDate() + 30)
        licensingInfo.expiresOn = now
        Studio.api.post('/api/licensing/trial', {})
      }
    }, 10000)
  }

  Studio.addToolbarComponent((props) => <div
    className='toolbar-button' onClick={() => licenseInfoModal()}>
    <div style={{textTransform: 'capitalize'}}><i className='fa fa-gavel' /> {licensingInfo.license} <i className='fa fa-info-circle' /></div>
  </div>, 'settings')
})
