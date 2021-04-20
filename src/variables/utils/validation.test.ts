import {validateVariableName} from 'src/variables/utils/validation'
import {RemoteDataState} from '../../types'

// Mocks
import {createVariable} from 'src/variables/mocks'

describe('Validation', () => {
  const variable3 = createVariable('apple', 'f(x: v.b)')
  const variableB = createVariable('banana', 'f(x: v.c)')
  const variableF = createVariable('fig', 'f(x: v.g)')

  const varList = [variable3, variableB, variableF]

  describe('variable name validation', () => {
    const fullErrorText =
      'Variable name must start with a letter or underscore, and ' +
      'contain only numbers, letters, and underscores.'

    it('rejects names with a special character in it', () => {
      const special1 = 'foo&'

      const valResult = validateVariableName(varList, special1)
      console.log('tried to validate...result??', valResult)

      expect(valResult.error).toEqual(fullErrorText)

      const valid1 = 'foo_78'
      expect(validateVariableName(varList, valid1).error).toBe(null)
    })
  })
})
