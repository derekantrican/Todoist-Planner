import Markdown from "markdown-to-jsx/react";

//Links are shown as just their text (I don't want to encourage clicking off the app during planning, as it would have to start over)
const LinkText = (props) => <span>{props.children}</span>;

const markdownOptions = {
  forceInline: true, //Task names are a single line of text, so don't wrap them in a paragraph
  disableParsingRawHTML: true, //Show any HTML in a task name as text rather than rendering it
  overrides: {a: LinkText},
};

//A task's name, with Todoist's markdown (bold, italics, links etc) rendered as React elements
export function TaskContent(props) {
  return <Markdown options={markdownOptions}>{props.content}</Markdown>;
}
