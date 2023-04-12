/**
FROM: //https://docs.aws.amazon.com/neptune/latest/userguide/streams-change-formats.html#streams-change-formats-gremlin
    vl – Vertex label for Gremlin; node label for openCypher.
    vp – Vertex properties for Gremlin; node properties for openCypher.
    e – Edge and edge label for Gremlin; relationship and relationship type for openCypher.
    ep – Edge properties for Gremlin; relationship properties for openCypher.
*/
export enum GremlinTypes {
  vl = 'vl',
  vp = 'vp',
  e = 'e',
  ep = 'ep',
}
