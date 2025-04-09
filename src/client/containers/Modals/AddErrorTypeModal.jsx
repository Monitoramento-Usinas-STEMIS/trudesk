/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Updated:    6/23/19 6:12 PM
 *  Copyright (c) 2014-2019 Trudesk, Inc. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { getErrorsTypeWithPage } from 'actions/tickets'
import { showModal, hideModal } from 'actions/common'

import BaseModal from 'containers/Modals/BaseModal'
import Button from 'components/Button'
import Log from '../../logger'
import axios from 'axios'
import $ from 'jquery'
import helpers from 'lib/helpers'

import { TICKETS_UI_ERRORSTYPE_UPDATE } from 'serverSocket/socketEventConsts'

class AddErrorsTypeModal extends React.Component {
  componentDidMount () {
    this.props.getErrorsTypeWithPage({ limit: -1, page: 0 })
  }

  componentDidUpdate () {
    helpers.setupChosen()
    if (!$(this.select).val() && this.props.currentErrorsType && this.props.currentErrorsType.length > 0)
      $(this.select).val(this.props.currenteErrorsType)

    $(this.select).trigger('chosen:updated')
  }

  onCreateErrorTypeClicked (e) {
    e.preventDefault()
    this.props.hideModal()
    setTimeout(() => {
      this.props.showModal('CREATE_ERROR_TYPE')
    }, 300)
  }

  onSubmit (e) {
    e.preventDefault()
    let selectedErrorsType = $(e.target.errorsType).val()
    if (!selectedErrorsType) selectedErrorsType = []
    axios
      .put(`/api/v1/tickets/${this.props.ticketId}`, {
        errorstype: selectedErrorsType
      })
      .then(() => {
        this.props.socket.emit(TICKETS_UI_ERRORSTYPE_UPDATE, { ticketId: this.props.ticketId })
        this.closeButton.click()
      })
      .catch(error => {
        Log.error(error)
        helpers.UI.showSnackbar(error, true)
      })
  }

  onClearClicked () {
    axios
      .put(`/api/v1/tickets/${this.props.ticketId}`, {
        errorstype: []
      })
      .then(() => {
        $(this.select)
          .val('')
          .trigger('chosen:updated')
        this.props.socket.emit(TICKETS_UI_ERRORSTYPE_UPDATE, { ticketId: this.props.ticketId })
      })
      .catch(error => {
        Log.error(error)
        helpers.UI.showSnackbar(error, true)
      })
  }

  render () {
    const mappedErrorsType =
      this.props.errorsTypeSettings.errorstype &&
      this.props.errorsTypeSettings.errorstype
        .map(errortype => {
          return {
            text: errortype.get('name'),
            value: errortype.get('_id')
          }
        })
        .toArray()

    return (
      <BaseModal options={{ bgclose: false }}>
        <div className={'uk-clearfix'}>
          <h5 style={{ fontWeight: 300 }}>Add ErrorType</h5>
          <div>
            <form className='nomargin' onSubmit={e => this.onSubmit(e)}>
              <div className='search-container'>
                <select
                  name='errorstype'
                  id='errorstype'
                  className='chosen-select'
                  multiple
                  data-placeholder=' '
                  data-noresults='No ErrorType Found for '
                  ref={r => (this.select = r)}
                >
                  {mappedErrorsType.map(errortype => (
                    <option key={errortype.value} value={errortype.value}>
                      {errortype.text}
                    </option>
                  ))}
                </select>
                <button type='button' style={{ borderRadius: 0 }} onClick={e => this.onCreateErrorTypeClicked(e)}>
                  <i className='material-icons' style={{ marginRight: 0 }}>
                    add
                  </i>
                </button>
              </div>

              <div className='left' style={{ marginTop: 15 }}>
                <Button
                  type={'button'}
                  text={'Clear'}
                  small={true}
                  flat={true}
                  style={'danger'}
                  onClick={e => this.onClearClicked(e)}
                />
              </div>
              <div className='right' style={{ marginTop: 15 }}>
                <Button
                  type={'button'}
                  text={'Cancel'}
                  style={'secondary'}
                  small={true}
                  flat={true}
                  waves={true}
                  extraClass={'uk-modal-close'}
                  ref={r => (this.closeButton = r)}
                />
                <Button type={'submit'} text={'Save ErrorType'} style={'success'} small={true} waves={true} />
              </div>
            </form>
          </div>
        </div>
      </BaseModal>
    )
  }
}

AddErrorsTypeModal.propTypes = {
  ticketId: PropTypes.string.isRequired,
  currentErrorsType: PropTypes.array,
  errorsTypeSettings: PropTypes.object.isRequired,
  getErrorsTypeWithPage: PropTypes.func.isRequired,
  socket: PropTypes.object.isRequired,
  showModal: PropTypes.func.isRequired,
  hideModal: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
  errorsTypeSettings: state.errorsTypeSettings,
  socket: state.shared.socket
})

export default connect(mapStateToProps, { getErrorsTypeWithPage, showModal, hideModal })(AddErrorsTypeModal)
