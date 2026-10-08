import { Prose } from "@rdloom/react";

export default function TypographyProseExample() {
  return (
    <div className="flex w-full justify-center">
      <Prose>
        <h2>Shipping a release</h2>
        <p>
          A release starts from <code>main</code>. Read the <a href="#notes">release notes</a> before you tag it.
        </p>
        <h3>Checklist</h3>
        <ul>
          <li>Run the full test suite</li>
          <li>Update the changelog</li>
        </ul>
        <blockquote>Small releases are easier to roll back.</blockquote>
        <hr />
        <table>
          <thead>
            <tr>
              <th>Step</th>
              <th>Owner</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Tag</td>
              <td>Release manager</td>
            </tr>
            <tr>
              <td>Announce</td>
              <td>Support</td>
            </tr>
          </tbody>
        </table>
      </Prose>
    </div>
  );
}
