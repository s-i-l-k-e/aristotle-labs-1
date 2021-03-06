// General api access functions
import axios from 'axios'
import { NiceError } from '@/error/class.js'

// Perform a graphql query on the aristotle registry
function graphqlQuery(query, variables) {
    // Url for our registries graphql endpoint
    const graphql_url = 'https://registry.aristotlemetadata.com/api/graphql/json'
    const query_obj = {query: query, variables: variables}
    return axios.post(graphql_url, query_obj)
}

// Check that graphql response is valid
function validateGraphqlResponse(data, root) {
    if (data.errors || data.data[root].edges.length === 0) {
        throw new Error("Graphql query was not successful")
    }
}

// Query a distribution and its components
export function queryDistribution(uuid) {
    const query = `
    query ($uuid: UUID) {
      distributions (uuid: $uuid) {
        edges {
          node {
            name
            distributiondataelementpathSet {
              logicalPath
              dataElement {
                name
                definition
                aristotleId
                uuid
                valueDomain {
                  uuid
                  dataType {
                    name
                  }
                  permissiblevalueSet {
                    id
                    value
                    meaning
                    valueMeaning {
                      id
                      name
                    }
                  }
                }
                dataElementConcept{
                  property {
                    aristotleId
                    uuid
                    name
                  }
                }
              }
            }
          }
        }
      }
    }`


    return graphqlQuery(query, {uuid: uuid}).then((response) => {
        validateGraphqlResponse(response.data, 'distributions')
        return response.data.data.distributions.edges[0].node
    }).catch((error) => {
        throw new NiceError('Could not fetch distribution metadata', error)
    })
}

// Query a dataset specification and its components
export function queryDss(uuid) {
    const query = `
    query ($uuid: UUID) {
      datasetSpecifications (uuid:$uuid) {
        edges {
          node {
            name
            uuid
            aristotleId
            dssdeinclusionSet {
              dataElement {
                uuid
                aristotleId
                name
                dataElementConcept {
                  property {
                    name
                  }
                }
                dedinputsthroughSet {
                  dataElementDerivation {
                    uuid
                    aristotleId
                    name
                    dedderivesthroughSet {
                      dataElement {
                        uuid
                        aristotleId
                        name
                        dataElementConcept {
                          property {
                            name
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }`

    return graphqlQuery(query, {uuid: uuid}).then((response) => {
        validateGraphqlResponse(response.data, 'datasetSpecifications')
        return response.data.data.datasetSpecifications.edges[0].node
    }).catch((error) => {
        throw new NiceError('Could not fetch dataset metadata', error)
    })
}

// Query a conceptual domain and its components
export function queryConceptualDomain(id) {
    const query = `
    query ($id:String) {
      conceptualDomains (aristotleId: $id) {
        edges {
          node {
            name
            uuid
            valuemeaningSet{
              name
              id
              definition
            }
          }
        }
      }
    }`

    return graphqlQuery(query, {id: id}).then((response) => {
        validateGraphqlResponse(response.data, 'conceptualDomains')
        let conceptualDomain = response.data.data.conceptualDomains.edges[0].node
        conceptualDomain.id = id
        return conceptualDomain
    }).catch((error) => {
        throw new NiceError('Could not fetch conceptual domain metadata', error)
    })
}

// Get a distributions data elements as options array
// Filter is an optional function that receives a data element and returns a boolean
// indicating its inclusion in the options
export function getDistributionOptions(distribution, filter) {
    let options = []
    for (let dep of distribution.distributiondataelementpathSet) {
        if (filter && !filter(dep.dataElement)) {
            continue
        }
        options.push({
            value: dep.dataElement.uuid,
            id: dep.dataElement.aristotleId,
            definition: dep.dataElement.definition,
            text: dep.dataElement.dataElementConcept.property.name,
            aristotleTooltipId: dep.dataElement.aristotleId,
        })
    }
    return options
}

// Filter for data elements to use with getDistributionOptions
export function filterNumberDataElements(dataElement) {
    if (dataElement.valueDomain && dataElement.valueDomain.dataType) {
        return dataElement.valueDomain.dataType.name === 'Number'
    }
    return false
}

// Filter for data element that have permissible values
export function filterValueDataElements(dataElement) {
    if (dataElement.valueDomain) {
        return dataElement.valueDomain.permissiblevalueSet.length > 0
    }
    return false
}

// Get map of data element uuid to logicalPath
export function mapDistributionData(distribution) {
    let map = new Map();
    for (let dep of distribution.distributiondataelementpathSet) {
        if (dep.dataElement) {
            map.set(dep.dataElement.uuid, dep.logicalPath)
        }
    }
    return map
}
