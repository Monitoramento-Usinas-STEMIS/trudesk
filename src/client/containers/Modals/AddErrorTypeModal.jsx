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

import { getErrorTypesWithPage } from 'actions/errorTypes'
import { showModal, hideModal } from 'actions/common'

import BaseModal from 'containers/Modals/BaseModal'
import Button from 'components/Button'
import Log from '../../logger'
import axios from 'axios'
import $ from 'jquery'
import helpers from 'lib/helpers'

import { ERROR_TYPES_UI_UPDATE } from 'serverSocket/socketEventConsts'

class AddErrorTypeModal extends React.Component {
  componentDidMount () {
    this.props.getErrorTypesWithPage({ limit: -1, page: 0 })
  }

  componentDidUpdate () {
    helpers.setupChosen()
    if (!$(this.select).val() && this.props.currentErrorTypes && this.props.currentErrorTypes.length > 0)
      $(this.select).val(this.props.currentErrorTypes)

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
    let selectedErrorTypes = $(e.target.errorTypes).val()
    if (!selectedErrorTypes) selectedErrorTypes = []
    axios
      .put(`/api/v1/error-types`, {
        errorTypes: selectedErrorTypes
      })
      .then(() => {
        this.props.socket.emit(ERROR_TYPES_UI_UPDATE)
        this.closeButton.click()
      })
      .catch(error => {
        Log.error(error)
        helpers.UI.showSnackbar(error, true)
      })
  }

  onClearClicked () {
    axios
      .put(`/api/v1/error-types`, {
        errorTypes: []
      })
      .then(() => {
        $(this.select)
          .val('')
          .trigger('chosen:updated')
        this.props.socket.emit(ERROR_TYPES_UI_UPDATE)
      })
      .catch(error => {
        Log.error(error)
        helpers.UI.showSnackbar(error, true)
      })
  }

  render () {
    const mappedErrorTypes =
      this.props.errorTypesSettings.errorTypes &&
      this.props.errorTypesSettings.errorTypes
        .map(errorType => {
          return {
            text: errorType.get('name'),
            value: errorType.get('_id')
          }
        })
        .toArray()

    return (
      <BaseModal options={{ bgclose: false }}>
        <div className={'uk-clearfix'}>
          <h5 style={{ fontWeight: 300 }}>Add Error Types</h5>
          <div>
            <form className='nomargin' onSubmit={e => this.onSubmit(e)}>
              <div className='search-container'>
                <select
                  name='errorTypes'
                  id='errorTypes'
                  className='chosen-select'
                  multiple
                  data-placeholder=' '
                  data-noresults='No Error Types Found for '
                  ref={r => (this.select = r)}
                >
                  {mappedErrorTypes.map(errorType => (
                    <option key={errorType.value} value={errorType.value}>
                      {errorType.text}
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
                <Button type={'submit'} text={'Save Error Types'} style={'success'} small={true} waves={true} />
              </div>
            </form>
          </div>
        </div>
      </BaseModal>
    )
  }
}
    AddErrorTypeModal.propTypes = {
      currentErrorTypes: PropTypes.array,
      errorTypesSettings: PropTypes.object.isRequired,
      getErrorTypesWithPage: PropTypes.func.isRequired,
      socket: PropTypes.object.isRequired,
      showModal: PropTypes.func.isRequired,
      hideModal: PropTypes.func.isRequired
    }
    
    const mapStateToProps = state => ({
      errorTypesSettings: state.errorTypesSettings,
      socket: state.shared.socket
    })
    
    export default connect(mapStateToProps, { getErrorTypesWithPage, showModal, hideModal })(AddErrorTypeModal)