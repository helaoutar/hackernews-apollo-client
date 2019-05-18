import React from "react";

const Link = ({
    description,
    url
}) => {
  return (
    <div>
      <div>
        {description} ({url})
      </div>
    </div>
  );
};

export default Link;
