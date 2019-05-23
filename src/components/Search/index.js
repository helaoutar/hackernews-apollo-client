import React, { useState } from "react";
import { withApollo } from "react-apollo";
import gql from "graphql-tag";
import Link from "../LinkList/Link";

const FEED_SEARCH_QUERY = gql`
  query FeedSearchQuery($filter: String!) {
    feed(filter: $filter) {
      links {
        id
        url
        description
        createdAt
        postedBy {
          id
          name
        }
        votes {
          id
          user {
            id
          }
        }
      }
    }
  }
`;

const Search = ({ client }) => {
  const [links, setLinks] = useState([]);
  const [filter, setFilter] = useState("");

  const _executeSearch = async () => {
    const result = await client.query({
      query: FEED_SEARCH_QUERY,
      variables: { filter }
    });

    const { links } = result.data.feed;
    setLinks(links);
  };

  return (
    <div>
      <h4 className="mv3">Search</h4>
      <div className="flex flex-column">
        <input type="text" onChange={e => setFilter(e.target.value)} />
      </div>
      <div className="flex mt3">
        <button onClick={_executeSearch}>OK</button>
      </div>
      {links.map((link, index) => (
        <Link key={link.id} {...link} index={index} />
      ))}
    </div>
  );
};

export default withApollo(Search);
